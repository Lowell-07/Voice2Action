
"use client";

import { usePathname } from 'next/navigation';
import { HeaderClient } from './header-client';

export function Header() {
  const pathname = usePathname();
  return <HeaderClient pathname={pathname} />;
}
