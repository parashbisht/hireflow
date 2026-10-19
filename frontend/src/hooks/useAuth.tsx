import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '../types/auth';
import { loginUser, registerUser } from '../services/authService';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAdmin: boolean;
  isRecruiter: boolean;
  isViewer: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredUser = (): User | null => {
  const savedUser = localStorage.getItem('hireflow_user');
  const savedToken = localStorage.getItem('hireflow_token');
  if (savedUser && savedToken) {
    try {
      return JSON.parse(savedUser) as User;
    } catch {
      return null;
    }
  }
  return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  const login = async (email: string, password: string) => {
    const data = await loginUser(email, password);
    localStorage.setItem('hireflow_token', data.token);
    localStorage.setItem('hireflow_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await registerUser(name, email, password);
    localStorage.setItem('hireflow_token', data.token);
    localStorage.setItem('hireflow_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('hireflow_token');
    localStorage.removeItem('hireflow_user');
    setUser(null);
  };

  const role = user?.role ?? null;
  const isAdmin = role === 'ADMIN';
  const isRecruiter = role === 'RECRUITER';
  const isViewer = role === 'VIEWER';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isRecruiter,
        isViewer,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
