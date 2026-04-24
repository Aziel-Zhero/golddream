
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as AppUser } from '@/types';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useAuth as useFirebaseAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

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
    if (fbUser && userData) {
      const emailVerified = fbUser.emailVerified;
      
      // Sincroniza o status de verificação com o Firestore se houver mudança
      if (userData.emailVerificado !== emailVerified) {
        setDoc(doc(firestore, 'usuarios', fbUser.uid), { emailVerificado: emailVerified }, { merge: true });
      }

      setAppUser({
        uid: fbUser.uid,
        email: fbUser.email || '',
        emailVerified: emailVerified,
        emailVerificado: emailVerified, // Campo extra para compatibilidade com o listador admin
        nome: userData.nome || fbUser.displayName || 'Cliente',
        telefone: userData.telefone || fbUser.phoneNumber || '',
        endereco: userData.endereco,
        papel: isAdminStatus ? 'admin' : 'cliente',
        dataCriacao: userData.dataCriacao || new Date().toISOString(),
        avatarUrl: fbUser.photoURL || `https://picsum.photos/seed/${fbUser.uid}/100/100`,
        isAdmin: isAdminStatus
      });
    } else {
      setAppUser(null);
    }
  }, [fbUser, userData, isAdminStatus, firestore]);

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
