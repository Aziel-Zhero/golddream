
"use client";

import { useEffect, useState } from 'react';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Promocao } from '@/types';

export function ThemeManager() {
  const firestore = useFirestore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const activeBFQuery = useMemoFirebase(() => {
    if (!isClient) return null;
    return query(
      collection(firestore, 'promocoes'),
      where('ativo', '==', true),
      where('isBlackFriday', '==', true)
    );
  }, [firestore, isClient]);

  const { data: bfPromos } = useCollection<Promocao>(activeBFQuery);

  useEffect(() => {
    if (!isClient) return;

    const checkActiveTheme = () => {
      const currentTime = new Date();
      const hasActiveBF = bfPromos?.some(p => {
        const start = new Date(p.dataInicio);
        const end = new Date(p.dataFim);
        return currentTime >= start && currentTime <= end;
      });

      if (hasActiveBF) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    checkActiveTheme();
    const interval = setInterval(checkActiveTheme, 60000);

    return () => clearInterval(interval);
  }, [bfPromos, isClient]);

  return null;
}
