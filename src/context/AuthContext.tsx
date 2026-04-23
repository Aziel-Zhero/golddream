"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as AppUser } from '@/types';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useAuth as useFirebaseAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut, sendEmailVerification } from 'firebase/auth';
import { doc } from 'firebase/firestore';

type AuthContextType = {
  user: (AppUser & { emailVerified: boolean }) | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AppUser>) => void;
  sendVerification: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: fbUser, isUserLoading } = useUser();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const pathname = usePathname();
  const router = useRouter();
  const [appUser, setAppUser] = useState<(AppUser & { emailVerified: boolean }) | null>(null);

  const userDocRef = useMemoFirebase(() => fbUser ? doc(firestore, 'usuarios', fbUser.uid) : null, [fbUser, firestore]);
  const { data: userData, isLoading: isDocLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (fbUser && userData) {
      setAppUser({
        uid: fbUser.uid,
        email: fbUser.email || '',
        emailVerified: fbUser.emailVerified,
        nome: userData.nome || fbUser.displayName || 'Cliente',
        telefone: userData.telefone || fbUser.phoneNumber || '',
        endereco: userData.endereco,
        papel: (userData.papel === 'admin' || userData.papel === 'administrador') ? 'admin' : 'cliente',
        dataCriacao: userData.dataCriacao || new Date().toISOString(),
        avatarUrl: fbUser.photoURL || `https://picsum.photos/seed/${fbUser.uid}/100/100`
      });
    } else if (!fbUser) {
      setAppUser(null);
    }
  }, [fbUser, userData]);

  useEffect(() => {
    // Redirecionamento para completar perfil se faltar endereço
    const isPublicPage = ['/auth/login', '/auth/register', '/'].includes(pathname) || 
                         pathname.startsWith('/category/') || 
                         pathname.startsWith('/products/') ||
                         pathname.startsWith('/suporte/');
    const isCompletingProfile = pathname === '/auth/complete-profile';
    const isAdminArea = pathname.startsWith('/admin');

    if (!isUserLoading && fbUser && !isDocLoading && appUser) {
      const isMissingAddress = !userData?.endereco?.cidade;
      const isAdmin = appUser.papel === 'admin';

      if (isMissingAddress && !isCompletingProfile && !isPublicPage && (!isAdmin || !isAdminArea)) {
        router.push('/auth/complete-profile');
      }
    }
  }, [fbUser, userData, appUser, isUserLoading, isDocLoading, pathname, router]);

  const logout = async () => {
    await signOut(auth);
    setAppUser(null);
    router.push('/');
  };

  const updateUser = (data: Partial<AppUser>) => {
    if (appUser) {
      setAppUser({ ...appUser, ...data } as any);
    }
  };

  const sendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user: appUser, 
      isLoading: isUserLoading || isDocLoading, 
      logout, 
      updateUser,
      sendVerification
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