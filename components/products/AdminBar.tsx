'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AdminBarProps {
  productId: number;
  productName: string;
}

export default function AdminBar({ productId, productName }: AdminBarProps) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(document.cookie.includes('admin_token='));
  }, []);

  if (!isAdmin) return null;

  return (
    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-4 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs bg-blue-800 px-2 py-0.5 rounded">ADMIN</span>
        <span className="text-sm font-medium truncate max-w-[200px]">{productName}</span>
      </div>
      <div className="flex items-center gap-3">
        <Link href={`/admin/produtos/${productId}`}
          className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded font-medium hover:bg-blue-50">
          Editar no Admin
        </Link>
      </div>
    </div>
  );
}
