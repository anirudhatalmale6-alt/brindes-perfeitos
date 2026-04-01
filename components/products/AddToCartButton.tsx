'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart-context';

interface AddToCartButtonProps {
  product: {
    id: number;
    name: string;
    slug: string;
    image_main: string | null;
    supplier_sku: string | null;
    category_name: string | null;
    min_order?: number | null;
    unit_price?: number | null;
  };
  quantity?: number;
  className?: string;
  size?: 'sm' | 'lg';
}

export default function AddToCartButton({ product, quantity = 1, className, size = 'sm' }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    const min = product.min_order || 1;
    const qty = Math.max(min, quantity);
    addItem({ ...product, min_order: product.min_order ?? null, unit_price: product.unit_price ?? null }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (size === 'lg') {
    return (
      <button
        onClick={handleAdd}
        className={`block w-full text-center py-3 rounded-lg font-semibold text-lg transition-colors ${
          added
            ? 'bg-green-500 text-white'
            : 'bg-amber-500 text-white hover:bg-amber-600'
        } ${className || ''}`}
      >
        {added ? 'Adicionado!' : 'Adicionar ao Carrinho'}
      </button>
    );
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAdd(); }}
      className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
        added
          ? 'bg-green-500 text-white'
          : 'bg-amber-500 text-white hover:bg-amber-600'
      } ${className || ''}`}
    >
      {added ? 'Adicionado!' : '+ Carrinho'}
    </button>
  );
}
