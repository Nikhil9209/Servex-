import * as SecureStore from 'expo-secure-store';
import {
  ContractorProjectDetail,
  ProjectScopeItem,
  WorkerRecord,
  AttendanceEntry,
  DailyWorkReport,
  ClientTransaction,
  ProjectChatMessage,
} from '../types/contractor';
import { INITIAL_CONTRACTOR_PROJECTS } from './contractorStorage';

const CONTRACTOR_PROJECTS_KEY = 'servex_contractor_projects_v2';
const memoryStore = new Map<string, string>();

const isWeb = typeof window !== 'undefined' && typeof (window as any).document !== 'undefined';

async function setStorageItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Fall through to memory
    }
  }

  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

async function getStorageItem(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fall through to memory
    }
  }

  try {
    const val = await SecureStore.getItemAsync(key);
    if (val !== null) return val;
    return memoryStore.get(key) || null;
  } catch {
    return memoryStore.get(key) || null;
  }
}

export const ContractorStorageService = {
  /**
   * Loads all contractor projects from local device storage.
   * If first time launch, initializes storage with default INITIAL_CONTRACTOR_PROJECTS.
   */
  async getProjects(): Promise<ContractorProjectDetail[]> {
    try {
      const raw = await getStorageItem(CONTRACTOR_PROJECTS_KEY);
      if (!raw) {
        await this.saveProjects(INITIAL_CONTRACTOR_PROJECTS);
        return INITIAL_CONTRACTOR_PROJECTS;
      }
      const parsed: ContractorProjectDetail[] = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        await this.saveProjects(INITIAL_CONTRACTOR_PROJECTS);
        return INITIAL_CONTRACTOR_PROJECTS;
      }
      return parsed;
    } catch {
      return INITIAL_CONTRACTOR_PROJECTS;
    }
  },

  /**
   * Persists the projects array into device storage.
   */
  async saveProjects(projects: ContractorProjectDetail[]): Promise<void> {
    await setStorageItem(CONTRACTOR_PROJECTS_KEY, JSON.stringify(projects));
  },

  /**
   * Finds a specific project by id.
   */
  async getProjectById(id: string): Promise<ContractorProjectDetail | null> {
    const list = await this.getProjects();
    return list.find((p) => p.id === id) || null;
  },

  /**
   * Creates a new project and saves to storage.
   */
  async createProject(
    data: Omit<
      ContractorProjectDetail,
      'id' | 'scopeItems' | 'workers' | 'todayAttendance' | 'dailyReports' | 'transactions'
    >
  ): Promise<ContractorProjectDetail> {
    const list = await this.getProjects();
    const newProject: ContractorProjectDetail = {
      ...data,
      id: `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      contractorId: data.contractorId ?? null,
      clientId: data.clientId ?? null,
      scopeItems: [],
      workers: [],
      todayAttendance: [],
      dailyReports: [],
      transactions: [],
      chatState: {
        workerMessagingAllowed: false,
        messages: [
          {
            id: `msg-${Date.now()}`,
            senderRole: 'contractor',
            senderName: 'Prime Contractor Lead',
            content: `Site workspace initialized for ${data.projectName}.`,
            timestamp: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            isAuthorityAction: true,
          },
        ],
      },
    };

    const updated = [newProject, ...list];
    await this.saveProjects(updated);
    return newProject;
  },

  /**
   * Updates an entire project object and saves to storage.
   */
  async updateProject(project: ContractorProjectDetail): Promise<ContractorProjectDetail> {
    const list = await this.getProjects();
    const index = list.findIndex((p) => p.id === project.id);
    const existing = index >= 0 ? list[index] : null;

    const mergedProject: ContractorProjectDetail = {
      ...project,
      // Preserve existing ownership if established
      contractorId:
        project.contractorId !== undefined
          ? project.contractorId
          : (existing?.contractorId ?? null),
      clientId:
        project.clientId !== undefined
          ? project.clientId
          : (existing?.clientId ?? null),
    };

    let updatedList: ContractorProjectDetail[];
    if (index >= 0) {
      updatedList = list.map((p) => (p.id === project.id ? mergedProject : p));
    } else {
      updatedList = [mergedProject, ...list];
    }
    await this.saveProjects(updatedList);
    return mergedProject;
  },

  /**
   * Deletes a project by id.
   */
  async deleteProject(id: string): Promise<void> {
    const list = await this.getProjects();
    const updated = list.filter((p) => p.id !== id);
    await this.saveProjects(updated);
  },

  /**
   * Looks up a project by its client code (e.g. "CLT-8842").
   */
  async findProjectByCode(clientCode: string): Promise<ContractorProjectDetail | null> {
    const list = await this.getProjects();
    const normalized = clientCode.trim().toUpperCase();
    return list.find((p) => p.clientCode.toUpperCase() === normalized) || null;
  },

  /**
   * Adds an itemized scope requirement to a project.
   */
  async addScopeItem(
    projectId: string,
    item: Omit<ProjectScopeItem, 'id' | 'completedQuantity'>
  ): Promise<ContractorProjectDetail | null> {
    const project = await this.getProjectById(projectId);
    if (!project) return null;

    const newItem: ProjectScopeItem = {
      ...item,
      id: `sc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      completedQuantity: 0,
    };

    const updated: ContractorProjectDetail = {
      ...project,
      scopeItems: [...project.scopeItems, newItem],
    };

    return await this.updateProject(updated);
  },

  /**
   * Adds a new worker and records their initial attendance.
   */
  async addWorker(
    projectId: string,
    worker: Omit<WorkerRecord, 'id'>
  ): Promise<ContractorProjectDetail | null> {
    const project = await this.getProjectById(projectId);
    if (!project) return null;

    const newWorker: WorkerRecord = {
      ...worker,
      id: `w-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    const initialAttendance: AttendanceEntry = {
      workerId: newWorker.id,
      workerName: newWorker.name,
      role: newWorker.role,
      dailyWage: newWorker.dailyWage,
      date: 'Today',
      status: 'present',
      checkInTime: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      proofVerified: false,
      proofNote: 'Newly enrolled crew member',
      wageCalculated: newWorker.dailyWage,
    };

    const updated: ContractorProjectDetail = {
      ...project,
      workers: [...project.workers, newWorker],
      todayAttendance: [...project.todayAttendance, initialAttendance],
    };

    return await this.updateProject(updated);
  },

  /**
   * Updates today's crew attendance records.
   */
  async updateAttendance(
    projectId: string,
    attendanceList: AttendanceEntry[]
  ): Promise<ContractorProjectDetail | null> {
    const project = await this.getProjectById(projectId);
    if (!project) return null;

    const updated: ContractorProjectDetail = {
      ...project,
      todayAttendance: attendanceList,
    };

    return await this.updateProject(updated);
  },

  /**
   * Saves an audited daily work report and updates completed quantities on scope items.
   */
  async saveDailyReport(
    projectId: string,
    report: DailyWorkReport
  ): Promise<ContractorProjectDetail | null> {
    const project = await this.getProjectById(projectId);
    if (!project) return null;

    // Update completed quantity on matching scope items
    const updatedScope = project.scopeItems.map((item) => {
      const match = report.items.find((i) => i.scopeItemId === item.id);
      if (match) {
        return {
          ...item,
          completedQuantity: Math.min(item.quantity, item.completedQuantity + match.qtyDoneToday),
        };
      }
      return item;
    });

    const updated: ContractorProjectDetail = {
      ...project,
      scopeItems: updatedScope,
      dailyReports: [report, ...project.dailyReports],
    };

    return await this.updateProject(updated);
  },

  /**
   * Adds a financial transaction entry to the ledger.
   */
  async addTransaction(
    projectId: string,
    tx: Omit<ClientTransaction, 'id'>
  ): Promise<ContractorProjectDetail | null> {
    const project = await this.getProjectById(projectId);
    if (!project) return null;

    const created: ClientTransaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    const updated: ContractorProjectDetail = {
      ...project,
      transactions: [created, ...project.transactions],
    };

    return await this.updateProject(updated);
  },

  /**
   * Appends a chat message to the project chat channel.
   */
  async sendChatMessage(
    projectId: string,
    message: ProjectChatMessage
  ): Promise<ContractorProjectDetail | null> {
    const project = await this.getProjectById(projectId);
    if (!project) return null;

    const currentChat = project.chatState || {
      workerMessagingAllowed: false,
      messages: [],
    };

    const updated: ContractorProjectDetail = {
      ...project,
      chatState: {
        ...currentChat,
        messages: [...currentChat.messages, message],
      },
    };

    return await this.updateProject(updated);
  },

  /**
   * Sets worker messaging authority toggle in the chat channel.
   */
  async toggleWorkerAuthority(
    projectId: string,
    allowed: boolean
  ): Promise<ContractorProjectDetail | null> {
    const project = await this.getProjectById(projectId);
    if (!project) return null;

    const currentChat = project.chatState || {
      workerMessagingAllowed: false,
      messages: [],
    };

    const notice: ProjectChatMessage = {
      id: `msg-auth-${Date.now()}`,
      senderRole: 'contractor',
      senderName: 'Prime Contractor Lead',
      content: allowed
        ? '🔓 Contractor granted messaging authority to workers. Site crew can now post updates.'
        : '🔒 Contractor restricted worker messaging authority. Worker channel locked.',
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      isAuthorityAction: true,
    };

    const updated: ContractorProjectDetail = {
      ...project,
      chatState: {
        workerMessagingAllowed: allowed,
        messages: [...currentChat.messages, notice],
      },
    };

    return await this.updateProject(updated);
  },

  /**
   * Resets local storage back to seed data.
   */
  async resetToSeedData(): Promise<ContractorProjectDetail[]> {
    await this.saveProjects(INITIAL_CONTRACTOR_PROJECTS);
    return INITIAL_CONTRACTOR_PROJECTS;
  },
};
