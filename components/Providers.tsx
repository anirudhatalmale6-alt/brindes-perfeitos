'use client';

import { CartProvider } from '@/lib/cart-context';
import { ReactNode } from 'react';
import WhatsAppWidget from '@/components/layout/WhatsAppWidget';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <WhatsAppWidget />
    </CartProvider>
  );
}
