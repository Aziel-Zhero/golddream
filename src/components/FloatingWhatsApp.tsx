
"use client";

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { SiteConfig } from '@/types';

export function FloatingWhatsApp() {
  const firestore = useFirestore();
  const configRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'geral'), [firestore]);
  const { data: config } = useDoc<SiteConfig>(configRef);

  const whatsapp = config?.whatsappNumber || '5512991862651';
  const cleanNumber = whatsapp.replace(/\D/g, '');
  
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre os produtos da Gold Dream.')}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 p-0 rounded-full hover:scale-110 active:scale-95 transition-all"
      aria-label="Chamar no WhatsApp"
    >
      <div className="flex items-center justify-center">
        {config?.whatsappIconUrl ? (
          <img 
            src={config.whatsappIconUrl} 
            alt="WhatsApp" 
            className="w-16 h-16 rounded-full object-cover" 
          />
        ) : (
          <div className="bg-[#25D366] text-white p-4 rounded-full shadow-2xl">
            <MessageCircle className="w-8 h-8 fill-current" />
          </div>
        )}
      </div>
    </a>
  );
}
