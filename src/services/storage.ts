import * as SecureStore from 'expo-secure-store';
import { AuthSession, StoredUserAccount } from '../types/auth';

const SESSION_KEY = 'servex_auth_session_v1';
const USERS_DB_KEY = 'servex_registered_users_v2';

// In-memory fallback if SecureStore is unavailable
const memoryFallback = new Map<string, string>();

const isWeb = typeof window !== 'undefined' && typeof (window as any).document !== 'undefined';

async function setItem(key: string, value: string): Promise<void> {
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
    memoryFallback.set(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
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
    const value = await SecureStore.getItemAsync(key);
    if (value !== null) return value;
    return memoryFallback.get(key) || null;
  } catch {
    return memoryFallback.get(key) || null;
  }
}

async function deleteItem(key: string): Promise<void> {
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
  memoryFallback.delete(key);
}

// Initial registered user pool with valid Supabase Auth UUID format for demo seed compatibility
const INITIAL_REGISTERED_USERS: StoredUserAccount[] = [
  {
    id: 'c11e0000-0000-4000-8000-000000000001',
    name: 'Alex Rivera',
    email: 'client@servex.com',
    phone: '9876543210',
    countryCode: '+91',
    role: 'client',
    authProvider: 'email',
    createdAt: new Date().toISOString(),
    isPhoneVerified: true,
    // Salted bcrypt hash (cost 10, unique salt 1) for demo/test seed compatibility - zero plaintext
    passwordHash: '$2b$10$mnTJlqVp5OpjuZUmCey9rOVxZQjXionJKmHG3lcDPWrNr2AtG/onm',
  },
  {
    id: 'c0a80000-0000-4000-8000-000000000002',
    name: 'Marcus Vance',
    email: 'contractor@servex.com',
    phone: '9876543211',
    countryCode: '+91',
    role: 'contractor',
    authProvider: 'email',
    createdAt: new Date().toISOString(),
    isPhoneVerified: true,
    // Salted bcrypt hash (cost 10, unique salt 2) for demo/test seed compatibility - zero plaintext
    passwordHash: '$2b$10$/iaFVBo4ZIN.OniEjMrKdujIS2BJgaCL8O2xcchcDMUVJB4iaiab.',
  },
  {
    id: '98120000-0000-4000-8000-000000000003',
    name: 'Priya Sharma',
    email: 'priya.sharma@gmail.com',
    phone: '9812345678',
    countryCode: '+91',
    role: 'contractor',
    authProvider: 'google',
    createdAt: new Date().toISOString(),
    isPhoneVerified: true,
  },
];

export const StorageService = {
  getItem(key: string): Promise<string | null> {
    return getItem(key);
  },

  setItem(key: string, value: string): Promise<void> {
    return setItem(key, value);
  },

  deleteItem(key: string): Promise<void> {
    return deleteItem(key);
  },

  async saveSession(session: AuthSession): Promise<void> {
    await setItem(SESSION_KEY, JSON.stringify(session));
  },

  async getSession(): Promise<AuthSession | null> {
    const raw = await getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const parsed: AuthSession = JSON.parse(raw);
      // Check expiration if desired
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        await deleteItem(SESSION_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  },

  async clearSession(): Promise<void> {
    await deleteItem(SESSION_KEY);
  },

  async getRegisteredUsers(): Promise<StoredUserAccount[]> {
    const raw = await getItem(USERS_DB_KEY);
    if (!raw) {
      // Initialize with default pool
      await setItem(USERS_DB_KEY, JSON.stringify(INITIAL_REGISTERED_USERS));
      return INITIAL_REGISTERED_USERS;
    }
    try {
      return JSON.parse(raw) as StoredUserAccount[];
    } catch {
      return INITIAL_REGISTERED_USERS;
    }
  },

  async saveRegisteredUsers(users: StoredUserAccount[]): Promise<void> {
    await setItem(USERS_DB_KEY, JSON.stringify(users));
  },

  async addRegisteredUser(user: StoredUserAccount): Promise<void> {
    const users = await this.getRegisteredUsers();
    const existingIndex = users.findIndex(
      (u) => u.email.toLowerCase() === user.email.toLowerCase() || u.id === user.id
    );
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.push(user);
    }
    await this.saveRegisteredUsers(users);
  },
};
