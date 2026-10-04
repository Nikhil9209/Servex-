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
import { ContractorBackendService } from '../services/contractorBackendService';
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
  addWorker: (
    projectId: string,
    worker: Omit<WorkerRecord, 'id'>
  ) => Promise<void>;
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
    addWorker: handleAddWorker,
    updateAttendance: handleUpdateAttendance,
    saveDailyReport: handleSaveDailyReport,
    addTransaction: handleAddTransaction,
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
    handleAddWorker,
    handleUpdateAttendance,
    handleSaveDailyReport,
    handleAddTransaction,
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
