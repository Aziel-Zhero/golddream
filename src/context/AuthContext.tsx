
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { usePathname, useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, name: string, userData?: Partial<User>) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('golddream_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Redirecionamento obrigatório para completar perfil
  useEffect(() => {
    if (!isLoading && user && !user.endereco?.cidade && pathname !== '/auth/complete-profile' && pathname !== '/auth/login' && pathname !== '/auth/register') {
      router.push('/auth/complete-profile');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, name: string, userData?: Partial<User>) => {
    setIsLoading(true);
    const newUser: User = {
      uid: userData?.uid || Math.random().toString(36).substr(2, 9),
      nome: name,
      email,
      papel: userData?.papel || 'cliente',
      dataCriacao: userData?.dataCriacao || new Date().toISOString(),
      avatarUrl: `https://picsum.photos/seed/${email}/100/100`,
      telefone: userData?.telefone,
      endereco: userData?.endereco
    };
    setUser(newUser);
    localStorage.setItem('golddream_user', JSON.stringify(newUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('golddream_user');
    router.push('/');
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('golddream_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
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
