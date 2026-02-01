import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from 'react';
import type { Profile } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export interface User {
  id: string;
  username: string;
  role: string;
}

export async function getProfile(_userId: string): Promise<Profile | null> {
  const token = localStorage.getItem('mindcare_token');
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    const profileData = await getProfile(user.id);
    setProfile(profileData);
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('mindcare_token');
    const storedUser = localStorage.getItem('mindcare_user');

    if (token && storedUser) {
      const userObj = JSON.parse(storedUser);
      setUser(userObj);
      getProfile(userObj.id).then(setProfile);
    }
    setLoading(false);
  }, []);

  const signInWithUsername = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '登录失败');
      }

      const userData: User = {
        id: data.tenantId,
        username: data.username,
        role: 'user', // 后台目前硬编码了
      };

      localStorage.setItem('mindcare_token', data.accessToken);
      localStorage.setItem('mindcare_user', JSON.stringify(userData));

      setUser(userData);
      const profileData = await getProfile(userData.id);
      setProfile(profileData);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const signUpWithUsername = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '注册失败');
      }

      // 注册成功后自动登录
      const userData: User = {
        id: data.tenantId,
        username: data.username,
        role: 'user',
      };

      localStorage.setItem('mindcare_token', data.accessToken);
      localStorage.setItem('mindcare_user', JSON.stringify(userData));

      setUser(userData);
      // 新注册用户Profile可能为空，可以尝试获取或初始化
      const profileData = await getProfile(userData.id);
      setProfile(profileData);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);


  const signOut = useCallback(async () => {
    localStorage.removeItem('mindcare_token');
    localStorage.removeItem('mindcare_user');
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    signInWithUsername,
    signUpWithUsername,
    signOut,
    refreshProfile
  }), [user, profile, loading, signInWithUsername, signUpWithUsername, signOut, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
