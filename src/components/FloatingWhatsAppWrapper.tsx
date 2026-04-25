
'use client';

import dynamic from 'next/dynamic';

export const FloatingWhatsAppWrapper = dynamic(
  () => import('./FloatingWhatsApp').then((mod) => mod.FloatingWhatsApp),
  { ssr: false }
);
