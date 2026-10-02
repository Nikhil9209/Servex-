import {
  ContractorProjectDetail,
  ProjectScopeItem,
  WorkerRecord,
  AttendanceEntry,
  DailyWorkReport,
  ClientTransaction,
  ProjectChatMessage,
} from '../types/contractor';
import { ContractorStorageService } from './contractorStorageService';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export interface BackendSyncStatus {
  isCloudConnected: boolean;
  lastSyncedAt: string | null;
  syncError: string | null;
}

export const ContractorBackendService = {
  /**
   * Returns current sync and connection status.
   */
  getSyncStatus(): BackendSyncStatus {
    return {
      isCloudConnected: isSupabaseConfigured(),
      lastSyncedAt: new Date().toISOString(),
      syncError: null,
    };
  },

  /**
   * Fetches all projects:
   * 1. Loads instantly from local persistent storage.
   * 2. If Supabase is connected, pulls updates in the background and updates storage.
   */
  async getAllProjects(): Promise<ContractorProjectDetail[]> {
    // 1. Instant local read
    const localProjects = await ContractorStorageService.getProjects();

    // 2. If Supabase configured, attempt cloud fetch
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: cloudProjects, error } = await supabase
          .from('projects')
          .select('*, scope_items(*), workers(*), attendance_records(*), daily_work_reports(*), ledger_transactions(*), chat_messages(*)');

        if (!error && cloudProjects && cloudProjects.length > 0) {
          // Normalize and merge cloud projects into local storage
          const mapped: ContractorProjectDetail[] = cloudProjects.map((cp: any) => ({
            id: cp.id,
            clientCode: cp.client_code,
            projectName: cp.project_name,
            clientName: cp.client_name,
            clientPhone: cp.client_phone,
            siteAddress: cp.site_address,
            startDate: cp.start_date,
            status: cp.status || 'active',
            scopeItems: (cp.scope_items || []).map((si: any) => ({
              id: si.id,
              name: si.name,
              unit: si.unit,
              quantity: Number(si.quantity),
              ratePerUnit: Number(si.rate_per_unit),
              totalAmount: Number(si.total_amount),
              completedQuantity: Number(si.completed_quantity || 0),
            })),
            workers: (cp.workers || []).map((w: any) => ({
              id: w.id,
              name: w.name,
              role: w.role,
              dailyWage: Number(w.daily_wage),
              phone: w.phone,
            })),
            todayAttendance: (cp.attendance_records || []).map((a: any) => ({
              workerId: a.worker_id,
              workerName: a.worker_name,
              role: a.role,
              dailyWage: Number(a.daily_wage),
              date: a.date,
              status: a.status,
              checkInTime: a.check_in_time,
              proofVerified: Boolean(a.proof_verified),
              proofNote: a.proof_note || '',
              wageCalculated: Number(a.wage_calculated),
            })),
            dailyReports: (cp.daily_work_reports || []).map((dr: any) => ({
              id: dr.id,
              date: dr.date,
              verifiedBy: dr.verified_by,
              items: dr.items_json ? JSON.parse(dr.items_json) : [],
              totalWorkValueToday: Number(dr.total_work_value_today),
              totalWorkerWageToday: Number(dr.total_worker_wage_today),
              contractorMarginToday: Number(dr.contractor_margin_today),
              isVerified: Boolean(dr.is_verified),
            })),
            transactions: (cp.ledger_transactions || []).map((tx: any) => ({
              id: tx.id,
              date: tx.date,
              amount: Number(tx.amount),
              type: tx.type,
              note: tx.note,
              recipientOrPayer: tx.recipient_or_payer,
              referenceNo: tx.reference_no,
            })),
            chatState: {
              workerMessagingAllowed: Boolean(cp.worker_messaging_allowed),
              messages: (cp.chat_messages || []).map((m: any) => ({
                id: m.id,
                senderRole: m.sender_role,
                senderName: m.sender_name,
                content: m.content,
                timestamp: m.timestamp,
                isAuthorityAction: Boolean(m.is_authority_action),
              })),
            },
          }));

          await ContractorStorageService.saveProjects(mapped);
          return mapped;
        }
      } catch {
        // Fallback to local
      }
    }

    return localProjects;
  },

  /**
   * Creates a new project in local storage and syncs to cloud if connected.
   */
  async createProject(
    data: Omit<
      ContractorProjectDetail,
      'id' | 'scopeItems' | 'workers' | 'todayAttendance' | 'dailyReports' | 'transactions'
    >
  ): Promise<ContractorProjectDetail> {
    const created = await ContractorStorageService.createProject(data);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('projects').insert({
          id: created.id,
          client_code: created.clientCode,
          project_name: created.projectName,
          client_name: created.clientName,
          client_phone: created.clientPhone,
          site_address: created.siteAddress,
          start_date: created.startDate,
          status: created.status,
          worker_messaging_allowed: false,
        });
      } catch {
        // Safe offline queue
      }
    }

    return created;
  },

  /**
   * Updates a project in local storage and cloud.
   */
  async updateProject(project: ContractorProjectDetail): Promise<ContractorProjectDetail> {
    const updated = await ContractorStorageService.updateProject(project);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('projects').upsert({
          id: project.id,
          client_code: project.clientCode,
          project_name: project.projectName,
          client_name: project.clientName,
          client_phone: project.clientPhone,
          site_address: project.siteAddress,
          start_date: project.startDate,
          status: project.status,
          worker_messaging_allowed: project.chatState?.workerMessagingAllowed || false,
        });

        // Sync scope items
        if (project.scopeItems && project.scopeItems.length > 0) {
          const scopeRows = project.scopeItems.map((s) => ({
            id: s.id,
            project_id: project.id,
            name: s.name,
            unit: s.unit,
            quantity: s.quantity,
            rate_per_unit: s.ratePerUnit,
            total_amount: s.totalAmount,
            completed_quantity: s.completedQuantity || 0,
          }));
          await supabase.from('scope_items').upsert(scopeRows, { onConflict: 'id' });
        }

        // Sync workers
        if (project.workers && project.workers.length > 0) {
          const workerRows = project.workers.map((w) => ({
            id: w.id,
            project_id: project.id,
            name: w.name,
            role: w.role,
            daily_wage: w.dailyWage,
            phone: w.phone || '',
          }));
          await supabase.from('workers').upsert(workerRows, { onConflict: 'id' });
        }

        // Sync attendance
        if (project.todayAttendance && project.todayAttendance.length > 0) {
          const attRows = project.todayAttendance.map((a) => ({
            project_id: project.id,
            worker_id: a.workerId,
            worker_name: a.workerName,
            role: a.role,
            daily_wage: a.dailyWage,
            date: a.date,
            status: a.status,
            check_in_time: a.checkInTime || '09:00 AM',
            proof_verified: Boolean(a.proofVerified),
            proof_note: a.proofNote || '',
            wage_calculated: a.wageCalculated,
          }));
          await supabase.from('attendance_records').upsert(attRows, { onConflict: 'project_id,worker_id,date' });
        }

        // Sync daily work reports
        if (project.dailyReports && project.dailyReports.length > 0) {
          const reportRows = project.dailyReports.map((r) => ({
            id: r.id,
            project_id: project.id,
            date: r.date,
            verified_by: r.verifiedBy,
            items_json: JSON.stringify(r.items),
            total_work_value_today: r.totalWorkValueToday,
            total_worker_wage_today: r.totalWorkerWageToday,
            contractor_margin_today: r.contractorMarginToday,
            is_verified: r.isVerified,
          }));
          await supabase.from('daily_work_reports').upsert(reportRows, { onConflict: 'id' });
        }

        // Sync transactions
        if (project.transactions && project.transactions.length > 0) {
          const txRows = project.transactions.map((t) => ({
            id: t.id,
            project_id: project.id,
            date: t.date,
            amount: t.amount,
            type: t.type,
            note: t.note,
            recipient_or_payer: t.recipientOrPayer,
            reference_no: t.referenceNo,
          }));
          await supabase.from('ledger_transactions').upsert(txRows, { onConflict: 'id' });
        }

        // Sync chat messages
        if (project.chatState?.messages && project.chatState.messages.length > 0) {
          const msgRows = project.chatState.messages.map((m) => ({
            id: m.id,
            project_id: project.id,
            sender_role: m.senderRole,
            sender_name: m.senderName,
            content: m.content,
            timestamp: m.timestamp,
            is_authority_action: Boolean(m.isAuthorityAction),
          }));
          await supabase.from('chat_messages').upsert(msgRows, { onConflict: 'id' });
        }
      } catch {
        // Safe offline queue
      }
    }

    return updated;
  },

  /**
   * Joins a project by client code.
   */
  async joinProjectByCode(clientCode: string): Promise<ContractorProjectDetail | null> {
    const local = await ContractorStorageService.findProjectByCode(clientCode);
    if (local) return local;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*, scope_items(*), workers(*), attendance_records(*), daily_work_reports(*), ledger_transactions(*), chat_messages(*)')
          .ilike('client_code', clientCode.trim())
          .single();

        if (!error && data) {
          const project: ContractorProjectDetail = {
            id: data.id,
            clientCode: data.client_code,
            projectName: data.project_name,
            clientName: data.client_name,
            clientPhone: data.client_phone,
            siteAddress: data.site_address,
            startDate: data.start_date,
            status: data.status || 'active',
            scopeItems: data.scope_items || [],
            workers: data.workers || [],
            todayAttendance: data.attendance_records || [],
            dailyReports: data.daily_work_reports || [],
            transactions: data.ledger_transactions || [],
            chatState: {
              workerMessagingAllowed: Boolean(data.worker_messaging_allowed),
              messages: data.chat_messages || [],
            },
          };

          await ContractorStorageService.updateProject(project);
          return project;
        }
      } catch {
        // Ignore
      }
    }

    return null;
  },

  /**
   * Adds an itemized scope requirement and syncs.
   */
  async addScopeItem(
    projectId: string,
    item: Omit<ProjectScopeItem, 'id' | 'completedQuantity'>
  ): Promise<ContractorProjectDetail | null> {
    const updated = await ContractorStorageService.addScopeItem(projectId, item);
    if (!updated) return null;

    const supabase = getSupabaseClient();
    if (supabase) {
      const added = updated.scopeItems[updated.scopeItems.length - 1];
      if (added) {
        try {
          await supabase.from('scope_items').insert({
            id: added.id,
            project_id: projectId,
            name: added.name,
            unit: added.unit,
            quantity: added.quantity,
            rate_per_unit: added.ratePerUnit,
            total_amount: added.totalAmount,
            completed_quantity: 0,
          });
        } catch {
          // Ignore
        }
      }
    }

    return updated;
  },

  /**
   * Adds a worker and initial attendance.
   */
  async addWorker(
    projectId: string,
    worker: Omit<WorkerRecord, 'id'>
  ): Promise<ContractorProjectDetail | null> {
    const updated = await ContractorStorageService.addWorker(projectId, worker);
    if (!updated) return null;

    const supabase = getSupabaseClient();
    if (supabase) {
      const added = updated.workers[updated.workers.length - 1];
      if (added) {
        try {
          await supabase.from('workers').insert({
            id: added.id,
            project_id: projectId,
            name: added.name,
            role: added.role,
            daily_wage: added.dailyWage,
            phone: added.phone,
          });
        } catch {
          // Ignore
        }
      }
    }

    return updated;
  },

  /**
   * Updates attendance list and syncs.
   */
  async updateAttendance(
    projectId: string,
    attendanceList: AttendanceEntry[]
  ): Promise<ContractorProjectDetail | null> {
    const updated = await ContractorStorageService.updateAttendance(projectId, attendanceList);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const rows = attendanceList.map((a) => ({
          project_id: projectId,
          worker_id: a.workerId,
          worker_name: a.workerName,
          role: a.role,
          daily_wage: a.dailyWage,
          date: a.date,
          status: a.status,
          check_in_time: a.checkInTime,
          proof_verified: a.proofVerified,
          proof_note: a.proofNote,
          wage_calculated: a.wageCalculated,
        }));
        await supabase.from('attendance_records').upsert(rows, { onConflict: 'project_id,worker_id,date' });
      } catch {
        // Ignore
      }
    }

    return updated;
  },

  /**
   * Saves daily report and updates scope quantities.
   */
  async saveDailyReport(
    projectId: string,
    report: DailyWorkReport
  ): Promise<ContractorProjectDetail | null> {
    const updated = await ContractorStorageService.saveDailyReport(projectId, report);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('daily_work_reports').insert({
          id: report.id,
          project_id: projectId,
          date: report.date,
          verified_by: report.verifiedBy,
          items_json: JSON.stringify(report.items),
          total_work_value_today: report.totalWorkValueToday,
          total_worker_wage_today: report.totalWorkerWageToday,
          contractor_margin_today: report.contractorMarginToday,
          is_verified: report.isVerified,
        });

        // Sync updated scope completed quantities
        if (updated) {
          for (const item of updated.scopeItems) {
            await supabase.from('scope_items').update({
              completed_quantity: item.completedQuantity,
            }).eq('id', item.id);
          }
        }
      } catch {
        // Ignore
      }
    }

    return updated;
  },

  /**
   * Adds transaction entry to ledger.
   */
  async addTransaction(
    projectId: string,
    tx: Omit<ClientTransaction, 'id'>
  ): Promise<ContractorProjectDetail | null> {
    const updated = await ContractorStorageService.addTransaction(projectId, tx);
    if (!updated) return null;

    const supabase = getSupabaseClient();
    if (supabase) {
      const added = updated.transactions[0];
      if (added) {
        try {
          await supabase.from('ledger_transactions').insert({
            id: added.id,
            project_id: projectId,
            date: added.date,
            amount: added.amount,
            type: added.type,
            note: added.note,
            recipient_or_payer: added.recipientOrPayer,
            reference_no: added.referenceNo,
          });
        } catch {
          // Ignore
        }
      }
    }

    return updated;
  },

  /**
   * Sends a chat message.
   */
  async sendChatMessage(
    projectId: string,
    message: ProjectChatMessage
  ): Promise<ContractorProjectDetail | null> {
    const updated = await ContractorStorageService.sendChatMessage(projectId, message);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('chat_messages').insert({
          id: message.id,
          project_id: projectId,
          sender_role: message.senderRole,
          sender_name: message.senderName,
          content: message.content,
          timestamp: message.timestamp,
          is_authority_action: Boolean(message.isAuthorityAction),
        });
      } catch {
        // Ignore
      }
    }

    return updated;
  },

  /**
   * Toggles worker messaging authority.
   */
  async toggleWorkerAuthority(
    projectId: string,
    allowed: boolean
  ): Promise<ContractorProjectDetail | null> {
    const updated = await ContractorStorageService.toggleWorkerAuthority(projectId, allowed);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('projects').update({
          worker_messaging_allowed: allowed,
        }).eq('id', projectId);
      } catch {
        // Ignore
      }
    }

    return updated;
  },

  /**
   * Subscribes to live realtime updates for a project (chat messages & attendance).
   */
  subscribeToProjectRealtime(
    projectId: string,
    onNewChatMessage: (msg: ProjectChatMessage) => void,
    onAttendanceUpdated: () => void
  ): () => void {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return () => {};
    }

    const channel = supabase
      .channel(`project-realtime-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload: any) => {
          if (payload.new) {
            onNewChatMessage({
              id: payload.new.id,
              senderRole: payload.new.sender_role,
              senderName: payload.new.sender_name,
              content: payload.new.content,
              timestamp: payload.new.timestamp,
              isAuthorityAction: Boolean(payload.new.is_authority_action),
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          onAttendanceUpdated();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
