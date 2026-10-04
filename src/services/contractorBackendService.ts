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
import { StorageService } from './storage';
import { generateSecureProjectCode } from '../utils/projectCodeGenerator';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(id?: string | null): boolean {
  return Boolean(id && UUID_REGEX.test(id));
}

export async function getAuthenticatedSupabaseIdentity(): Promise<{ uid: string | null; role: string | null }> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (user && isValidUuid(user.id)) {
        // Remediation 3: Server-authoritative role verification from user_roles
        // Never trust client-writable user.user_metadata.role directly
        let authoritativeRole: string | null = null;
        try {
          const { data: roleRow, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          if (!roleError && roleRow?.role) {
            authoritativeRole = roleRow.role;
          }
        } catch {
          // Table query failed
        }

        if (!authoritativeRole) {
          try {
            const { data: rpcRole, error: rpcError } = await supabase.rpc('get_my_role');
            if (!rpcError && rpcRole && (rpcRole === 'contractor' || rpcRole === 'client')) {
              authoritativeRole = rpcRole;
            }
          } catch {
            // RPC fallback
          }
        }

        // Only fall back to local verified session if DB is unreachable or offline
        if (!authoritativeRole) {
          const session = await StorageService.getSession();
          if (session?.user?.id === user.id && session.user.role) {
            authoritativeRole = session.user.role;
          }
        }

        return {
          uid: user.id,
          role: authoritativeRole,
        };
      }
    } catch {
      // Supabase user fetch failed
    }
  }

  // Check local session only if ID is a verified Supabase Auth UUID
  try {
    const session = await StorageService.getSession();
    if (session?.user?.id && isValidUuid(session.user.id)) {
      return {
        uid: session.user.id,
        role: session.user.role || null,
      };
    }
  } catch {
    // Session read failed
  }

  return { uid: null, role: null };
}

export interface BackendSyncStatus {
  isCloudConnected: boolean;
  lastSyncedAt: string | null;
  syncError: string | null;
}

export const ContractorBackendService = {
  getAuthenticatedSupabaseIdentity,

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
  async getAllProjects(userId?: string | null): Promise<ContractorProjectDetail[]> {
    // 1. Instant local read
    const localProjects = await ContractorStorageService.getProjects(userId);

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
            contractorId: cp.contractor_id || null,
            clientId: cp.client_id || null,
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

          await ContractorStorageService.saveProjects(mapped, userId);
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
    // Authenticated identity is the sole authority for ownership.
    // Arbitrary contractor_id or client_id in client input is never blindly accepted.
    const { uid, role } = await getAuthenticatedSupabaseIdentity();

    // Remediation 3: Server-authoritative role enforcement
    // Clients can NEVER create contractor projects
    if (uid && role === 'client') {
      throw new Error('Unauthorized: Client accounts cannot create projects. Projects must be created by a contractor.');
    }

    if (uid && role !== 'contractor') {
      throw new Error('Unauthorized: Only verified contractor accounts can create projects.');
    }

    let contractorId: string | null = null;
    let clientId: string | null = null;

    if (uid) {
      contractorId = uid;
    }

    const created = await ContractorStorageService.createProject(
      {
        ...data,
        contractorId,
        clientId,
      },
      uid
    );

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
          contractor_id: contractorId,
          client_id: clientId,
          code_created_at: created.codeCreatedAt || new Date().toISOString(),
          code_expires_at:
            created.codeExpiresAt ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
    const existing = await ContractorStorageService.getProjectById(project.id);
    const { uid, role } = await getAuthenticatedSupabaseIdentity();

    if (existing) {
      // 1. Clients cannot modify project operational/administrative details
      if (uid && role === 'client' && existing.contractorId && uid !== existing.contractorId) {
        throw new Error('Unauthorized: Clients cannot modify project details');
      }

      // 2. Unrelated contractor cannot modify another contractor's project
      if (uid && role === 'contractor' && existing.contractorId && uid !== existing.contractorId) {
        throw new Error('Unauthorized: Cannot modify projects owned by another contractor');
      }

      // 3. Contractor cannot alter client_id (cannot assign, replace, remove, or set arbitrary UUID)
      if (project.clientId !== undefined && project.clientId !== existing.clientId) {
        throw new Error('Unauthorized: client_id cannot be modified via updateProject. Use join_project_by_code.');
      }

      // 4. Contractor cannot alter contractor_id
      if (project.contractorId !== undefined && project.contractorId !== existing.contractorId) {
        throw new Error('Unauthorized: contractor_id cannot be modified');
      }
    } else {
      throw new Error('Unauthorized: Project not found or caller lacks permission to modify');
    }

    // Preserve existing ownership from storage/cloud
    const contractorId = existing?.contractorId ?? (isValidUuid(project.contractorId) ? project.contractorId : null);
    const clientId = existing?.clientId ?? (isValidUuid(project.clientId) ? project.clientId : null);

    const projectToUpdate: ContractorProjectDetail = {
      ...project,
      contractorId,
      clientId,
    };

    const updated = await ContractorStorageService.updateProject(projectToUpdate, uid);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('projects').update({
          client_code: project.clientCode,
          project_name: project.projectName,
          client_name: project.clientName,
          client_phone: project.clientPhone,
          site_address: project.siteAddress,
          start_date: project.startDate,
          status: project.status,
          worker_messaging_allowed: project.chatState?.workerMessagingAllowed || false,
        }).eq('id', project.id);

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
   * Role and authorization invariants:
   * 1. Caller must be authenticated.
   * 2. Caller's role must be 'client'. Contractors can never claim projects.
   * 3. Online mode: Authoritative Supabase RPC `join_project_by_code` is executed.
   * 4. Once joined, project is saved ONLY into the joining client's own user-scoped cache.
   * 5. Offline mode: Controlled atomic local linking via ContractorStorageService.linkProjectByCodeLocally.
   */
  async joinProjectByCode(clientCode: string): Promise<ContractorProjectDetail | null> {
    if (!clientCode || !clientCode.trim()) {
      throw new Error('Project code is required');
    }

    const trimmedCode = clientCode.trim();
    const { uid, role } = await getAuthenticatedSupabaseIdentity();

    if (!uid) {
      throw new Error('Authentication required to join project');
    }

    // Requirement 5: Role enforcement
    // A contractor must never be able to claim a project as client.
    if (role === 'contractor') {
      const callerProjects = await ContractorStorageService.getProjects(uid);
      const ownProject = callerProjects.find(
        (p) => p.clientCode?.toUpperCase() === trimmedCode.toUpperCase()
      );
      if (ownProject) {
        throw new Error('Contractor cannot join their own project as client');
      }
      throw new Error('Contractor cannot join project as client: Only client accounts can join projects');
    }

    if (role !== 'client') {
      throw new Error('Unauthorized: Only client accounts can join projects via project code');
    }

    // ONLINE MODE: Authoritative Supabase RPC
    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('join_project_by_code', {
          p_client_code: trimmedCode,
        });

        if (rpcErr) {
          if (rpcErr.message && rpcErr.message.includes('Too many failed')) {
            throw new Error(rpcErr.message);
          }
          if (
            rpcErr.message &&
            (rpcErr.message.includes('Project not found') ||
              rpcErr.message.includes('Invalid or expired project code'))
          ) {
            return null;
          }
          throw new Error(rpcErr.message);
        }

        if (!rpcData) {
          return null;
        }

        const targetId = rpcData.id;
        const query = supabase
          .from('projects')
          .select('*, scope_items(*), workers(*), attendance_records(*), daily_work_reports(*), ledger_transactions(*), chat_messages(*)')
          .eq('id', targetId)
          .single();

        const { data, error } = await query;

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
            contractorId: data.contractor_id || null,
            clientId: data.client_id || uid || null,
            codeCreatedAt: data.code_created_at || null,
            codeExpiresAt: data.code_expires_at || null,
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

          // Save ONLY into joining user's own local cache
          await ContractorStorageService.updateProject(project, uid);
          return project;
        }
      } catch (err: any) {
        if (
          err.message &&
          (err.message.includes('already linked') ||
            err.message.includes('Authentication required') ||
            err.message.includes('Contractor cannot join') ||
            err.message.includes('Too many failed'))
        ) {
          throw err;
        }
        if (
          err.message &&
          (err.message.includes('Project not found') ||
            err.message.includes('Invalid or expired project code'))
        ) {
          return null;
        }
        // Safe offline queue / fallback to local linking if network/offline
      }
    }

    // OFFLINE MODE: Controlled local linking
    return await ContractorStorageService.linkProjectByCodeLocally(trimmedCode, uid, role);
  },

  /**
   * Rotates a project's client invite code to a new CSPRNG-generated code.
   * Can only be executed by the verified contractor who owns the project.
   */
  async rotateProjectCode(
    projectId: string,
    newCode?: string
  ): Promise<ContractorProjectDetail | null> {
    const { uid, role } = await getAuthenticatedSupabaseIdentity();
    if (!uid || role !== 'contractor') {
      throw new Error('Unauthorized: Only verified contractor accounts can rotate project codes');
    }

    const secureCode = newCode?.trim() || generateSecureProjectCode();

    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.rpc('rotate_project_code', {
          p_project_id: projectId,
          p_new_code: secureCode,
        });

        if (!error && data) {
          const local = await ContractorStorageService.getProjectById(projectId, uid);
          if (local) {
            local.clientCode = secureCode;
            local.codeCreatedAt = data.code_created_at || new Date().toISOString();
            local.codeExpiresAt =
              data.code_expires_at ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            await ContractorStorageService.updateProject(local, uid);
            return local;
          }
        }
      } catch {
        // Fall back to local
      }
    }

    return await ContractorStorageService.rotateProjectCodeLocally(projectId, secureCode, uid);
  },

  /**
   * Adds an itemized scope requirement and syncs.
   */
  async addScopeItem(
    projectId: string,
    item: Omit<ProjectScopeItem, 'id' | 'completedQuantity'>
  ): Promise<ContractorProjectDetail | null> {
    const { uid } = await getAuthenticatedSupabaseIdentity();
    const updated = await ContractorStorageService.addScopeItem(projectId, item, uid);
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
    const { uid } = await getAuthenticatedSupabaseIdentity();
    const updated = await ContractorStorageService.addWorker(projectId, worker, uid);
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
    const { uid } = await getAuthenticatedSupabaseIdentity();
    const updated = await ContractorStorageService.updateAttendance(projectId, attendanceList, uid);

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
    const { uid } = await getAuthenticatedSupabaseIdentity();
    const updated = await ContractorStorageService.saveDailyReport(projectId, report, uid);

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
    const { uid } = await getAuthenticatedSupabaseIdentity();
    const updated = await ContractorStorageService.addTransaction(projectId, tx, uid);
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
    const { uid } = await getAuthenticatedSupabaseIdentity();
    const updated = await ContractorStorageService.sendChatMessage(projectId, message, uid);

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
    const { uid } = await getAuthenticatedSupabaseIdentity();
    const updated = await ContractorStorageService.toggleWorkerAuthority(projectId, allowed, uid);

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
