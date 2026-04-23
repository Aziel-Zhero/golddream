
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as AppUser } from '@/types';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useAuth as useFirebaseAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut, sendEmailVerification } from 'firebase/auth';
import { doc } from 'firebase/firestore';

type AuthContextType = {
  user: (AppUser & { emailVerified: boolean; isAdmin: boolean }) | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AppUser>) => void;
  sendVerification: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: fbUser, isUserLoading } = useUser();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const pathname = usePathname();
  const router = useRouter();
  const [appUser, setAppUser] = useState<(AppUser & { emailVerified: boolean; isAdmin: boolean }) | null>(null);

  const userDocRef = useMemoFirebase(() => fbUser ? doc(firestore, 'usuarios', fbUser.uid) : null, [fbUser, firestore]);
  const { data: userData, isLoading: isDocLoading } = useDoc(userDocRef);

  const isAdminStatus = userData?.papel === 'admin' || userData?.papel === 'administrador';

  useEffect(() => {
    if (fbUser) {
      if (userData) {
        setAppUser({
          uid: fbUser.uid,
          email: fbUser.email || '',
          emailVerified: fbUser.emailVerified,
          nome: userData.nome || fbUser.displayName || 'Cliente',
          telefone: userData.telefone || fbUser.phoneNumber || '',
          endereco: userData.endereco,
          papel: isAdminStatus ? 'admin' : 'cliente',
          dataCriacao: userData.dataCriacao || new Date().toISOString(),
          avatarUrl: fbUser.photoURL || `https://picsum.photos/seed/${fbUser.uid}/100/100`,
          isAdmin: isAdminStatus
        });
      }
    } else {
      setAppUser(null);
    }
  }, [fbUser, userData, isAdminStatus]);

  useEffect(() => {
    if (!isUserLoading && fbUser && !isDocLoading && appUser) {
      const isPublicPage = ['/auth/login', '/auth/register', '/', '/auth/complete-profile'].includes(pathname) || 
                           pathname.startsWith('/category/') || 
                           pathname.startsWith('/products/') ||
                           pathname.startsWith('/suporte/');
      
      const isMissingAddress = !userData?.endereco?.cidade;
      const isAdmin = appUser.isAdmin;

      if (isMissingAddress && !isPublicPage && !isAdmin) {
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
      sendVerification,
      isAdmin: isAdminStatus
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
