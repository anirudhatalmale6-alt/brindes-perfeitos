'use client';

import { useState } from 'react';
import AddToCartButton from '@/components/products/AddToCartButton';

interface ProductActionsProps {
  product: {
    id: number;
    name: string;
    slug: string;
    image_main: string | null;
    supplier_sku: string | null;
    category_name: string | null;
  };
}

export default function ProductActions({ product }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="mt-8 space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Quantidade:</label>
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-l-lg"
          >
            -
          </button>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 text-center py-2 border-x border-gray-300"
          />
          <button
            onClick={() => setQuantity(q => q + 1)}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-r-lg"
          >
            +
          </button>
        </div>
      </div>
      <AddToCartButton product={product} quantity={quantity} size="lg" />
    </div>
  );
}
