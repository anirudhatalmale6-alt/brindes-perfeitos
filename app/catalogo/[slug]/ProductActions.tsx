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
    min_order: number | null;
    unit_price?: number | null;
  };
}

export default function ProductActions({ product }: ProductActionsProps) {
  const min = product.min_order || 1;
  const [quantity, setQuantity] = useState(min);

  return (
    <div className="mt-8 space-y-3">
      {product.min_order && product.min_order > 1 && (
        <p className="text-sm text-amber-600 font-medium">
          Pedido minimo: {product.min_order} unidades
        </p>
      )}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Quantidade:</label>
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button
            onClick={() => setQuantity(q => Math.max(min, q - 1))}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-l-lg"
          >
            -
          </button>
          <input
            type="number"
            min={min}
            value={quantity}
            onChange={e => setQuantity(Math.max(min, parseInt(e.target.value) || min))}
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
