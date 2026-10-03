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
import { StorageService } from './storage';
import { getSupabaseClient } from './supabaseClient';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(id?: string | null): boolean {
  return Boolean(id && UUID_REGEX.test(id));
}

export const CACHE_PREFIX = 'servex_contractor_projects_v2';
export const UNOWNED_SEED_KEY = 'servex_unowned_seed_projects_v2';
export const LEGACY_STATIC_KEY = 'servex_contractor_projects_v2';
export const USER_REGISTRY_KEY = 'servex_user_cache_registry_v2';

export function getProjectStorageKey(userId?: string | null): string {
  if (userId && isValidUuid(userId)) {
    return `${CACHE_PREFIX}_${userId.toLowerCase()}`;
  }
  return UNOWNED_SEED_KEY;
}

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

async function deleteStorageItem(key: string): Promise<void> {
  if (isWeb) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore
    }
  }

  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Ignore
  }
  memoryStore.delete(key);
}

async function registerUserKey(userId: string): Promise<void> {
  if (!userId || !isValidUuid(userId)) return;
  const normalized = userId.toLowerCase();
  try {
    const raw = await getStorageItem(USER_REGISTRY_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(normalized)) {
      list.push(normalized);
      await setStorageItem(USER_REGISTRY_KEY, JSON.stringify(list));
    }
  } catch {
    // Ignore
  }
}

async function getRegisteredUserIds(): Promise<string[]> {
  const ids = new Set<string>();
  try {
    const raw = await getStorageItem(USER_REGISTRY_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach((id) => {
          if (typeof id === 'string' && isValidUuid(id)) {
            ids.add(id.toLowerCase());
          }
        });
      }
    }
  } catch {
    // Ignore
  }

  // Also check memoryStore keys for test environments
  for (const k of memoryStore.keys()) {
    if (k.startsWith(CACHE_PREFIX + '_')) {
      const candidateId = k.slice(CACHE_PREFIX.length + 1);
      if (isValidUuid(candidateId)) {
        ids.add(candidateId.toLowerCase());
      }
    }
  }

  // Also check localStorage in web environments
  if (isWeb) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith(CACHE_PREFIX + '_')) {
            const candidateId = k.slice(CACHE_PREFIX.length + 1);
            if (isValidUuid(candidateId)) {
              ids.add(candidateId.toLowerCase());
            }
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  return Array.from(ids);
}

export const ContractorStorageService = {
  /**
   * Resolves the active authenticated user ID.
   * Priority:
   * 1. Explicit verified UUID passed as argument.
   * 2. Verified Supabase Auth UID.
   * 3. Verified local session user ID in StorageService.
   * Returns null if unauthenticated.
   */
  async resolveActiveUserId(userId?: string | null): Promise<string | null> {
    if (userId && isValidUuid(userId)) {
      return userId;
    }

    // 1. Check Supabase Auth
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id && isValidUuid(data.user.id)) {
          return data.user.id;
        }
      } catch {
        // Safe offline fallback
      }
    }

    // 2. Check local session
    try {
      const session = await StorageService.getSession();
      if (session?.user?.id && isValidUuid(session.user.id)) {
        return session.user.id;
      }
    } catch {
      // Safe offline fallback
    }

    return null;
  },

  /**
   * Safely migrates projects from the legacy un-namespaced key if any exist.
   * CRITICAL SECURITY INVARIANT:
   * - Only projects where contractorId === targetUserId OR clientId === targetUserId are imported.
   * - Never blindly assigns unverified or other users' projects.
   * - Deletes the legacy static key immediately to prevent future cross-user leakage.
   */
  async migrateLegacyCache(targetUserId: string): Promise<void> {
    if (!targetUserId || !isValidUuid(targetUserId)) return;

    const legacyRaw = await getStorageItem(LEGACY_STATIC_KEY);
    if (!legacyRaw) return;

    try {
      const legacyList = JSON.parse(legacyRaw);
      if (Array.isArray(legacyList) && legacyList.length > 0) {
        const ownedByUser = legacyList.filter(
          (p: ContractorProjectDetail) => p.contractorId === targetUserId || p.clientId === targetUserId
        );

        if (ownedByUser.length > 0) {
          const userKey = getProjectStorageKey(targetUserId);
          const currentRaw = await getStorageItem(userKey);
          const currentList: ContractorProjectDetail[] = currentRaw ? JSON.parse(currentRaw) : [];
          const merged = [
            ...ownedByUser,
            ...currentList.filter((cp) => !ownedByUser.some((op) => op.id === cp.id)),
          ];
          await setStorageItem(userKey, JSON.stringify(merged));
        }
      }
    } catch {
      // Ignore parse failure
    } finally {
      await deleteStorageItem(LEGACY_STATIC_KEY);
    }
  },

  /**
   * Loads projects from user-scoped device storage.
   * - Authenticated user: reads servex_contractor_projects_v2_<userId>.
   * - Unauthenticated user: reads servex_unowned_seed_projects_v2 (unowned catalog only).
   */
  async getProjects(userId?: string | null): Promise<ContractorProjectDetail[]> {
    const activeUserId = await this.resolveActiveUserId(userId);

    // 1. Authenticated user: check legacy migration then load user namespace
    if (activeUserId) {
      await this.migrateLegacyCache(activeUserId);
      const userKey = getProjectStorageKey(activeUserId);
      const raw = await getStorageItem(userKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch {
          // Ignore
        }
      }

      // First time launch for this user: initialize with default seed catalog
      await setStorageItem(userKey, JSON.stringify(INITIAL_CONTRACTOR_PROJECTS));
      return INITIAL_CONTRACTOR_PROJECTS;
    }

    // 2. Unauthenticated caller: access strictly unowned seed catalog
    const unownedRaw = await getStorageItem(UNOWNED_SEED_KEY);
    if (!unownedRaw) {
      await setStorageItem(UNOWNED_SEED_KEY, JSON.stringify(INITIAL_CONTRACTOR_PROJECTS));
      return INITIAL_CONTRACTOR_PROJECTS;
    }
    try {
      const parsed: ContractorProjectDetail[] = JSON.parse(unownedRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      await setStorageItem(UNOWNED_SEED_KEY, JSON.stringify(INITIAL_CONTRACTOR_PROJECTS));
      return INITIAL_CONTRACTOR_PROJECTS;
    } catch {
      return INITIAL_CONTRACTOR_PROJECTS;
    }
  },

  /**
   * Persists projects array into user-scoped device storage.
   */
  async saveProjects(projects: ContractorProjectDetail[], userId?: string | null): Promise<void> {
    const activeUserId = await this.resolveActiveUserId(userId);
    const key = getProjectStorageKey(activeUserId);
    await setStorageItem(key, JSON.stringify(projects));
    if (activeUserId) {
      await registerUserKey(activeUserId);
    }
  },

  /**
   * Finds a specific project by id in the user's scoped storage or unowned demonstration catalog.
   * Never inspects other users' private caches.
   */
  async getProjectById(id: string, userId?: string | null): Promise<ContractorProjectDetail | null> {
    // 1. If explicit userId provided, check strictly that user's cache
    if (userId) {
      const list = await this.getProjects(userId);
      return list.find((p) => p.id === id) || null;
    }

    // 2. Check active caller's cache
    const activeUserId = await this.resolveActiveUserId(userId);
    if (activeUserId) {
      const list = await this.getProjects(activeUserId);
      const found = list.find((p) => p.id === id);
      if (found) return found;
    }

    // 3. Check unowned seed cache
    const unownedRaw = await getStorageItem(UNOWNED_SEED_KEY);
    if (unownedRaw) {
      try {
        const unownedList: ContractorProjectDetail[] = JSON.parse(unownedRaw);
        const found = unownedList.find((p) => p.id === id);
        if (found) return found;
      } catch {
        // Ignore
      }
    }

    return null;
  },

  /**
   * Creates a new project and saves to the user's scoped storage.
   */
  async createProject(
    data: Omit<
      ContractorProjectDetail,
      'id' | 'scopeItems' | 'workers' | 'todayAttendance' | 'dailyReports' | 'transactions'
    >,
    userId?: string | null
  ): Promise<ContractorProjectDetail> {
    const activeUserId = await this.resolveActiveUserId(userId);
    const list = await this.getProjects(activeUserId);

    const newProject: ContractorProjectDetail = {
      ...data,
      id: `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      contractorId: data.contractorId ?? (activeUserId ? activeUserId : null),
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
    await this.saveProjects(updated, activeUserId);
    return newProject;
  },



  /**
   * Updates an entire project object and saves to the user's scoped storage.
   */
  async updateProject(project: ContractorProjectDetail, userId?: string | null): Promise<ContractorProjectDetail> {
    const activeUserId = await this.resolveActiveUserId(userId);
    const list = await this.getProjects(activeUserId);
    const index = list.findIndex((p) => p.id === project.id);
    const existing = index >= 0 ? list[index] : null;

    const mergedProject: ContractorProjectDetail = {
      ...project,
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
    await this.saveProjects(updatedList, activeUserId);
    return mergedProject;
  },

  /**
   * Deletes a project by id from the user's scoped storage.
   */
  async deleteProject(id: string, userId?: string | null): Promise<void> {
    const activeUserId = await this.resolveActiveUserId(userId);
    if (userId) {
      const list = await this.getProjects(activeUserId);
      const updated = list.filter((p) => p.id !== id);
      await this.saveProjects(updated, activeUserId);
      return;
    }

    // Default: delete from caller's cache
    if (activeUserId) {
      const list = await this.getProjects(activeUserId);
      const updated = list.filter((p) => p.id !== id);
      await this.saveProjects(updated, activeUserId);
    }

    // Also delete from unowned seed cache if present
    const unownedRaw = await getStorageItem(UNOWNED_SEED_KEY);
    if (unownedRaw) {
      try {
        const unownedList: ContractorProjectDetail[] = JSON.parse(unownedRaw);
        const filtered = unownedList.filter((p) => p.id !== id);
        if (filtered.length !== unownedList.length) {
          await setStorageItem(UNOWNED_SEED_KEY, JSON.stringify(filtered));
        }
      } catch {
        // Ignore
      }
    }

  },

  /**
   * Looks up a project by its client code strictly in caller's user-scoped storage
   * or unowned demonstration seed catalog.
   * NEVER inspects other users' private caches.
   */
  async findProjectByCode(clientCode: string, userId?: string | null): Promise<ContractorProjectDetail | null> {
    const normalized = clientCode.trim().toUpperCase();
    if (!normalized) return null;

    // 1. Check current caller's cache first
    const callerList = await this.getProjects(userId);
    const inCaller = callerList.find((p) => p.clientCode?.toUpperCase() === normalized);
    if (inCaller) return inCaller;

    // 2. Check unowned seed cache
    const unownedRaw = await getStorageItem(UNOWNED_SEED_KEY);
    if (unownedRaw) {
      try {
        const unownedList: ContractorProjectDetail[] = JSON.parse(unownedRaw);
        const inUnowned = unownedList.find((p) => p.clientCode?.toUpperCase() === normalized);
        if (inUnowned) return inUnowned;
      } catch {
        // Ignore
      }
    }

    return null;
  },

  /**
   * Internal atomic linking helper for local/offline client project code linking.
   * CRITICAL SECURITY INVARIANTS:
   * 1. Caller must be an authenticated user with verified role 'client'.
   * 2. Contractors can NEVER claim projects via code.
   * 3. Cannot claim project if already linked to another client.
   * 4. Never exposes project data prior to successful linking.
   */
  async linkProjectByCodeLocally(
    clientCode: string,
    clientUid: string,
    clientRole: string | null
  ): Promise<ContractorProjectDetail | null> {
    if (!clientCode || !clientCode.trim()) {
      throw new Error('Project code is required');
    }
    if (!clientUid || !isValidUuid(clientUid)) {
      throw new Error('Authentication required to join project');
    }
    if (clientRole !== 'client') {
      throw new Error('Unauthorized: Only client accounts can join projects via project code');
    }

    const normalized = clientCode.trim().toUpperCase();

    // 1. Check if already in client's own cache (idempotent re-join)
    const clientProjects = await this.getProjects(clientUid);
    const existingInClient = clientProjects.find(
      (p) => p.clientCode?.toUpperCase() === normalized
    );
    if (existingInClient) {
      if (existingInClient.clientId && existingInClient.clientId !== clientUid) {
        throw new Error('This project is already linked to another client account');
      }
      if (!existingInClient.clientId) {
        existingInClient.clientId = clientUid;
        await this.updateProject(existingInClient, clientUid);
      }
      return existingInClient;
    }

    // 2. Check unowned seed catalog
    const unownedRaw = await getStorageItem(UNOWNED_SEED_KEY);
    if (unownedRaw) {
      try {
        const unownedList: ContractorProjectDetail[] = JSON.parse(unownedRaw);
        const match = unownedList.find((p) => p.clientCode?.toUpperCase() === normalized);
        if (match && match.contractorId === null && match.clientId === null) {
          match.clientId = clientUid;
          await this.updateProject(match, clientUid);
          return match;
        }
      } catch {
        // Ignore
      }
    }

    // 3. Check registered caches for unlinked candidate project to link
    const registeredIds = await getRegisteredUserIds();
    for (const uid of registeredIds) {
      if (uid === clientUid) continue;
      const key = getProjectStorageKey(uid);
      const raw = await getStorageItem(key);
      if (!raw) continue;
      try {
        const list: ContractorProjectDetail[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          const matchIndex = list.findIndex(
            (p) => p.clientCode?.toUpperCase() === normalized
          );
          if (matchIndex >= 0) {
            const candidate = list[matchIndex];
            // Contractor cannot join their own project as client
            if (candidate.contractorId && candidate.contractorId === clientUid) {
              throw new Error('Contractor cannot join their own project as client');
            }
            // Project already claimed by another client
            if (candidate.clientId && candidate.clientId !== clientUid) {
              throw new Error('This project is already linked to another client account');
            }

            // ATOMIC LINKING: Assign client_id and sync
            candidate.clientId = clientUid;
            list[matchIndex] = candidate;
            await setStorageItem(key, JSON.stringify(list));

            // Place authorized project into client's own cache
            await this.updateProject(candidate, clientUid);
            return candidate;
          }
        }
      } catch (err: any) {
        if (
          err.message &&
          (err.message.includes('Contractor cannot join') ||
            err.message.includes('already linked') ||
            err.message.includes('Unauthorized'))
        ) {
          throw err;
        }
      }
    }

    return null;
  },

  /**
   * Adds an itemized scope requirement to a project.
   */
  async addScopeItem(
    projectId: string,
    item: Omit<ProjectScopeItem, 'id' | 'completedQuantity'>,
    userId?: string | null
  ): Promise<ContractorProjectDetail | null> {
    const project = await this.getProjectById(projectId, userId);
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

    return await this.updateProject(updated, userId);
  },

  /**
   * Adds a new worker and records their initial attendance.
   */
  async addWorker(
    projectId: string,
    worker: Omit<WorkerRecord, 'id'>,
    userId?: string | null
  ): Promise<ContractorProjectDetail | null> {
    const project = await this.getProjectById(projectId, userId);
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

    return await this.updateProject(updated, userId);
  },

  /**
   * Updates today's crew attendance records.
   */
  async updateAttendance(
    projectId: string,
    attendanceList: AttendanceEntry[],
    userId?: string | null
  ): Promise<ContractorProjectDetail | null> {
    const project = await this.getProjectById(projectId, userId);
    if (!project) return null;

    const updated: ContractorProjectDetail = {
      ...project,
      todayAttendance: attendanceList,
    };

    return await this.updateProject(updated, userId);
  },

  /**
   * Saves an audited daily work report and updates completed quantities on scope items.
   */
  async saveDailyReport(
    projectId: string,
    report: DailyWorkReport,
    userId?: string | null
  ): Promise<ContractorProjectDetail | null> {
    const project = await this.getProjectById(projectId, userId);
    if (!project) return null;

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

    return await this.updateProject(updated, userId);
  },

  /**
   * Adds a financial transaction entry to the ledger.
   */
  async addTransaction(
    projectId: string,
    tx: Omit<ClientTransaction, 'id'>,
    userId?: string | null
  ): Promise<ContractorProjectDetail | null> {
    const project = await this.getProjectById(projectId, userId);
    if (!project) return null;

    const created: ClientTransaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    const updated: ContractorProjectDetail = {
      ...project,
      transactions: [created, ...project.transactions],
    };

    return await this.updateProject(updated, userId);
  },

  /**
   * Appends a chat message to the project chat channel.
   */
  async sendChatMessage(
    projectId: string,
    message: ProjectChatMessage,
    userId?: string | null
  ): Promise<ContractorProjectDetail | null> {
    const project = await this.getProjectById(projectId, userId);
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

    return await this.updateProject(updated, userId);
  },

  /**
   * Sets worker messaging authority toggle in the chat channel.
   */
  async toggleWorkerAuthority(
    projectId: string,
    allowed: boolean,
    userId?: string | null
  ): Promise<ContractorProjectDetail | null> {
    const project = await this.getProjectById(projectId, userId);
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

    return await this.updateProject(updated, userId);
  },

  /**
   * Resets the user's scoped storage back to seed data.
   */
  async resetToSeedData(userId?: string | null): Promise<ContractorProjectDetail[]> {
    const activeUserId = await this.resolveActiveUserId(userId);
    await this.saveProjects(INITIAL_CONTRACTOR_PROJECTS, activeUserId);
    return INITIAL_CONTRACTOR_PROJECTS;
  },

  /**
   * Purges user-scoped local cache upon factory reset or account deletion.
   */
  async clearUserCache(userId?: string | null): Promise<void> {
    const activeUserId = await this.resolveActiveUserId(userId);
    if (activeUserId) {
      const key = getProjectStorageKey(activeUserId);
      await deleteStorageItem(key);
    }
  },
};
