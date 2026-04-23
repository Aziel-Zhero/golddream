
'use client';

import dynamic from 'next/dynamic';

export const FooterWrapper = dynamic(
  () => import('./Footer').then((mod) => mod.Footer),
  { ssr: false }
);
