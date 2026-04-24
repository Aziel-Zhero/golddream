"use client";

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { SiteConfig } from '@/types';

export function FaviconManager() {
  const firestore = useFirestore();
  const configRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'geral'), [firestore]);
  const { data: config } = useDoc<SiteConfig>(configRef);

  useEffect(() => {
    if (config?.faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = config.faviconUrl;
    }
  }, [config?.faviconUrl]);

  return null;
}