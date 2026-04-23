
'use client';

import dynamic from 'next/dynamic';

export const NavbarWrapper = dynamic(
  () => import('./Navbar').then((mod) => mod.Navbar),
  { ssr: false }
);
