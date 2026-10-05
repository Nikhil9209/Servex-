import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  ContractorProjectDetail,
  ProjectScopeItem,
  WorkerRecord,
  AttendanceEntry,
  DailyWorkReport,
  ClientTransaction,
  ProjectChatMessage,
} from '../types/contractor';
import { ContractorBackendService, isValidUuid } from '../services/contractorBackendService';
import { getSupabaseClient, isSupabaseConfigured } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

interface ContractorContextValue {
  projects: ContractorProjectDetail[];
  selectedProjectId: string | null;
  selectedProject: ContractorProjectDetail | null;
  isLoading: boolean;
  isSyncing: boolean;
  isCloudConnected: boolean;
  setSelectedProjectId: (id: string | null) => void;
  createProject: (
    data: Omit<
      ContractorProjectDetail,
      'id' | 'scopeItems' | 'workers' | 'todayAttendance' | 'dailyReports' | 'transactions'
    >
  ) => Promise<ContractorProjectDetail>;
  updateProject: (project: ContractorProjectDetail) => Promise<void>;
  joinProjectByCode: (clientCode: string) => Promise<ContractorProjectDetail | null>;
  rotateProjectCode: (projectId: string, newCode?: string) => Promise<ContractorProjectDetail | null>;
  addScopeItem: (
    projectId: string,
    item: Omit<ProjectScopeItem, 'id' | 'completedQuantity'>
  ) => Promise<void>;
  deleteScopeItem: (projectId: string, itemId: string) => Promise<void>;
  addWorker: (
    projectId: string,
    worker: Omit<WorkerRecord, 'id'>
  ) => Promise<void>;
  deleteWorker: (projectId: string, workerId: string) => Promise<void>;
  updateAttendance: (
    projectId: string,
    attendanceList: AttendanceEntry[]
  ) => Promise<void>;
  saveDailyReport: (
    projectId: string,
    report: DailyWorkReport
  ) => Promise<void>;
  addTransaction: (
    projectId: string,
    tx: Omit<ClientTransaction, 'id'>
  ) => Promise<void>;
  voidTransaction: (
    projectId: string,
    transactionId: string,
    reason?: string
  ) => Promise<void>;
  deleteTransaction: (
    projectId: string,
    transactionId: string
  ) => Promise<void>;
  getProjectFinancialSummary: (
    projectId: string
  ) => Promise<{ totalReceived: number; totalWagesPaid: number; netBalance: number; isRestricted: boolean }>;
  archiveProject: (projectId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  sendChatMessage: (
    projectId: string,
    message: ProjectChatMessage
  ) => Promise<void>;
  toggleWorkerAuthority: (
    projectId: string,
    allowed: boolean
  ) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const ContractorContext = createContext<ContractorContextValue | null>(null);

export const ContractorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ContractorProjectDetail[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const isCloudConnected = useMemo(() => {
    return ContractorBackendService.getSyncStatus().isCloudConnected;
  }, []);

  const loadAllProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setSelectedProjectId(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await ContractorBackendService.getAllProjects(user.id);
      setProjects(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    async function syncProjects() {
      if (!user) {
        if (isMounted) {
          setProjects([]);
          setSelectedProjectId(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await ContractorBackendService.getAllProjects(user.id);
        if (isMounted) {
          setProjects(data);
          setSelectedProjectId(null);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    syncProjects();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Task 9: Realtime Linked-Project Updates
  useEffect(() => {
    if (!user || !user.id || !isValidUuid(user.id)) return;

    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return;

    const isClient = user.role === 'client';
    const filter = isClient ? `client_id=eq.${user.id}` : `contractor_id=eq.${user.id}`;
    const channelName = `realtime_projects_${user.id}_${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter,
        },
        async (payload: any) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setProjects((prev) => prev.filter((p) => p.id !== deletedId));
              setSelectedProjectId((curr) => (curr === deletedId ? null : curr));
            }
          } else if (payload.eventType === 'INSERT') {
            const newRow = payload.new;
            if (newRow?.id) {
              const fullProjects = await ContractorBackendService.getAllProjects(user.id);
              setProjects(fullProjects);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new;
            if (updatedRow?.id) {
              setProjects((prev) =>
                prev.map((p) =>
                  p.id === updatedRow.id
                    ? {
                        ...p,
                        projectName: updatedRow.project_name || p.projectName,
                        clientCode: updatedRow.client_code || p.clientCode,
                        clientName: updatedRow.client_name || p.clientName,
                        clientPhone: updatedRow.client_phone || p.clientPhone,
                        siteAddress: updatedRow.site_address || p.siteAddress,
                        startDate: updatedRow.start_date || p.startDate,
                        status: updatedRow.status || p.status,
                        contractorId: updatedRow.contractor_id ?? p.contractorId,
                        clientId: updatedRow.client_id ?? p.clientId,
                        archivedAt: updatedRow.archived_at ?? p.archivedAt,
                        chatState: {
                          ...p.chatState,
                          workerMessagingAllowed:
                            updatedRow.worker_messaging_allowed !== undefined
                              ? Boolean(updatedRow.worker_messaging_allowed)
                              : p.chatState?.workerMessagingAllowed || false,
                          messages: p.chatState?.messages || [],
                        },
                      }
                    : p
                )
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const handleCreateProject = useCallback(
    async (
      data: Omit<
        ContractorProjectDetail,
        'id' | 'scopeItems' | 'workers' | 'todayAttendance' | 'dailyReports' | 'transactions'
      >
    ): Promise<ContractorProjectDetail> => {
      setIsSyncing(true);
      try {
        const created = await ContractorBackendService.createProject(data);
        setProjects((prev) => [created, ...prev]);
        return created;
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  const handleUpdateProject = useCallback(
    async (project: ContractorProjectDetail): Promise<void> => {
      // Optimistic update
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));

      try {
        await ContractorBackendService.updateProject(project);
      } catch {
        // Rollback on fatal failure if needed
      }
    },
    []
  );

  const handleJoinProjectByCode = useCallback(
    async (clientCode: string): Promise<ContractorProjectDetail | null> => {
      setIsSyncing(true);
      try {
        const found = await ContractorBackendService.joinProjectByCode(clientCode);
        if (found) {
          setProjects((prev) => {
            const exists = prev.some((p) => p.id === found.id);
            if (exists) {
              return prev.map((p) => (p.id === found.id ? found : p));
            }
            return [found, ...prev];
          });
        }
        return found;
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  const handleRotateProjectCode = useCallback(
    async (projectId: string, newCode?: string): Promise<ContractorProjectDetail | null> => {
      setIsSyncing(true);
      try {
        const rotated = await ContractorBackendService.rotateProjectCode(projectId, newCode);
        if (rotated) {
          setProjects((prev) =>
            prev.map((p) => (p.id === rotated.id ? rotated : p))
          );
        }
        return rotated;
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  const handleAddScopeItem = useCallback(
    async (
      projectId: string,
      item: Omit<ProjectScopeItem, 'id' | 'completedQuantity'>
    ): Promise<void> => {
      const updated = await ContractorBackendService.addScopeItem(projectId, item);
      if (updated) {
        setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      }
    },
    []
  );

  const handleDeleteScopeItem = useCallback(
    async (projectId: string, itemId: string): Promise<void> => {
      const updated = await ContractorBackendService.deleteScopeItem(projectId, itemId);
      if (updated) {
        setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      }
    },
    []
  );

  const handleAddWorker = useCallback(
    async (
      projectId: string,
      worker: Omit<WorkerRecord, 'id'>
    ): Promise<void> => {
      const updated = await ContractorBackendService.addWorker(projectId, worker);
      if (updated) {
        setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      }
    },
    []
  );

  const handleDeleteWorker = useCallback(
    async (projectId: string, workerId: string): Promise<void> => {
      const updated = await ContractorBackendService.deleteWorker(projectId, workerId);
      if (updated) {
        setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      }
    },
    []
  );

  const handleUpdateAttendance = useCallback(
    async (
      projectId: string,
      attendanceList: AttendanceEntry[]
    ): Promise<void> => {
      const updated = await ContractorBackendService.updateAttendance(projectId, attendanceList);
      if (updated) {
        setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      }
    },
    []
  );

  const handleSaveDailyReport = useCallback(
    async (
      projectId: string,
      report: DailyWorkReport
    ): Promise<void> => {
      const updated = await ContractorBackendService.saveDailyReport(projectId, report);
      if (updated) {
        setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      }
    },
    []
  );

  const handleAddTransaction = useCallback(
    async (
      projectId: string,
      tx: Omit<ClientTransaction, 'id'>
    ): Promise<void> => {
      const updated = await ContractorBackendService.addTransaction(projectId, tx);
      if (updated) {
        setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      }
    },
    []
  );

  const handleVoidTransaction = useCallback(
    async (projectId: string, transactionId: string, reason?: string): Promise<void> => {
      const updated = await ContractorBackendService.voidTransaction(projectId, transactionId, reason);
      if (updated) {
        setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      }
    },
    []
  );

  const handleDeleteTransaction = useCallback(
    async (projectId: string, transactionId: string): Promise<void> => {
      const updated = await ContractorBackendService.deleteTransaction(projectId, transactionId);
      if (updated) {
        setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      }
    },
    []
  );

  const handleGetFinancialSummary = useCallback(
    async (projectId: string) => {
      return await ContractorBackendService.getProjectFinancialSummary(projectId);
    },
    []
  );

  const handleArchiveProject = useCallback(
    async (projectId: string): Promise<void> => {
      const updated = await ContractorBackendService.archiveProject(projectId);
      if (updated) {
        setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      }
    },
    []
  );

  const handleDeleteProject = useCallback(
    async (projectId: string): Promise<void> => {
      await ContractorBackendService.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setSelectedProjectId((curr) => (curr === projectId ? null : curr));
    },
    []
  );

  const handleSendChatMessage = useCallback(
    async (
      projectId: string,
      message: ProjectChatMessage
    ): Promise<void> => {
      const updated = await ContractorBackendService.sendChatMessage(projectId, message);
      if (updated) {
        setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      }
    },
    []
  );

  const handleToggleWorkerAuthority = useCallback(
    async (
      projectId: string,
      allowed: boolean
    ): Promise<void> => {
      const updated = await ContractorBackendService.toggleWorkerAuthority(projectId, allowed);
      if (updated) {
        setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      }
    },
    []
  );

  const value = useMemo<ContractorContextValue>(() => ({
    projects,
    selectedProjectId,
    selectedProject,
    isLoading,
    isSyncing,
    isCloudConnected,
    setSelectedProjectId,
    createProject: handleCreateProject,
    updateProject: handleUpdateProject,
    joinProjectByCode: handleJoinProjectByCode,
    rotateProjectCode: handleRotateProjectCode,
    addScopeItem: handleAddScopeItem,
    deleteScopeItem: handleDeleteScopeItem,
    addWorker: handleAddWorker,
    deleteWorker: handleDeleteWorker,
    updateAttendance: handleUpdateAttendance,
    saveDailyReport: handleSaveDailyReport,
    addTransaction: handleAddTransaction,
    voidTransaction: handleVoidTransaction,
    deleteTransaction: handleDeleteTransaction,
    getProjectFinancialSummary: handleGetFinancialSummary,
    archiveProject: handleArchiveProject,
    deleteProject: handleDeleteProject,
    sendChatMessage: handleSendChatMessage,
    toggleWorkerAuthority: handleToggleWorkerAuthority,
    refreshProjects: loadAllProjects,
  }), [
    projects,
    selectedProjectId,
    selectedProject,
    isLoading,
    isSyncing,
    isCloudConnected,
    handleCreateProject,
    handleUpdateProject,
    handleJoinProjectByCode,
    handleRotateProjectCode,
    handleAddScopeItem,
    handleDeleteScopeItem,
    handleAddWorker,
    handleDeleteWorker,
    handleUpdateAttendance,
    handleSaveDailyReport,
    handleAddTransaction,
    handleVoidTransaction,
    handleDeleteTransaction,
    handleGetFinancialSummary,
    handleArchiveProject,
    handleDeleteProject,
    handleSendChatMessage,
    handleToggleWorkerAuthority,
    loadAllProjects,
  ]);

  return (
    <ContractorContext.Provider value={value}>
      {children}
    </ContractorContext.Provider>
  );
};

export function useContractor(): ContractorContextValue {
  const context = useContext(ContractorContext);
  if (!context) {
    throw new Error('useContractor must be used within a ContractorProvider');
  }
  return context;
}

