"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as AppUser } from '@/types';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useAuth as useFirebaseAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';

type AuthContextType = {
  user: AppUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AppUser>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: fbUser, isUserLoading } = useUser();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const pathname = usePathname();
  const router = useRouter();
  const [appUser, setAppUser] = useState<AppUser | null>(null);

  // Busca os dados complementares do usuário no Firestore
  const userDocRef = useMemoFirebase(() => fbUser ? doc(firestore, 'usuarios', fbUser.uid) : null, [fbUser, firestore]);
  const { data: userData, isLoading: isDocLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (fbUser && userData) {
      setAppUser({
        uid: fbUser.uid,
        email: fbUser.email || '',
        nome: userData.nome || fbUser.displayName || 'Cliente',
        telefone: userData.telefone || '',
        endereco: userData.endereco,
        papel: userData.papel || 'cliente',
        dataCriacao: userData.dataCriacao || new Date().toISOString(),
        avatarUrl: fbUser.photoURL || `https://picsum.photos/seed/${fbUser.uid}/100/100`
      });
    } else if (!fbUser) {
      setAppUser(null);
    }
  }, [fbUser, userData]);

  // Redirecionamento obrigatório para completar perfil
  useEffect(() => {
    const isPublicPage = ['/auth/login', '/auth/register', '/'].includes(pathname);
    const isCompletingProfile = pathname === '/auth/complete-profile';

    if (!isUserLoading && fbUser && !isDocLoading) {
      // Se logado mas sem dados básicos de endereço, obriga a completar perfil
      if (!userData?.endereco?.cidade && !isCompletingProfile && !isPublicPage) {
        router.push('/auth/complete-profile');
      }
    }
  }, [fbUser, userData, isUserLoading, isDocLoading, pathname, router]);

  const logout = async () => {
    await signOut(auth);
    setAppUser(null);
    router.push('/');
  };

  const updateUser = (data: Partial<AppUser>) => {
    if (appUser) {
      setAppUser({ ...appUser, ...data });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user: appUser, 
      isLoading: isUserLoading || isDocLoading, 
      logout, 
      updateUser 
    }}>
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