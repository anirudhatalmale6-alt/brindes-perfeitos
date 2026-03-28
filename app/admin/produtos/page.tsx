'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  slug: string;
  supplier: string;
  supplier_sku: string;
  image_main: string;
  category_name: string;
  is_active: number;
  is_featured: number;
  created_at: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [supplier, setSupplier] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadProducts() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20', search, supplier });
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products);
    setTotal(data.total);
    setLoading(false);
  }

  useEffect(() => { loadProducts(); }, [page, search, supplier]);

  async function toggleActive(id: number, current: number) {
    await fetch('/api/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: current ? 0 : 1 }),
    });
    loadProducts();
  }

  async function toggleFeatured(id: number, current: number) {
    await fetch('/api/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_featured: current ? 0 : 1 }),
    });
    loadProducts();
  }

  async function deleteProduct(id: number) {
    if (!confirm('Excluir este produto?')) return;
    await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    loadProducts();
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Produtos ({total})</h1>
        <Link href="/admin/produtos/novo" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          + Novo Produto
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b flex gap-4">
          <input
            type="text" placeholder="Buscar produtos..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <select
            value={supplier} onChange={e => { setSupplier(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Todos Fornecedores</option>
            <option value="spotgifts">SpotGifts</option>
            <option value="xbzbrindes">XBZ Brindes</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhum produto encontrado</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="px-4 py-3">Imagem</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Fornecedor</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {p.image_main ? (
                      <img src={p.image_main} alt="" className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">Sem img</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/produtos/${p.id}`} className="text-blue-600 hover:underline font-medium text-sm">
                      {p.name}
                    </Link>
                    {p.supplier_sku && <p className="text-xs text-gray-400">SKU: {p.supplier_sku}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.supplier}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.category_name || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => toggleActive(p.id, p.is_active)}
                        className={`text-xs px-2 py-1 rounded ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                      <button onClick={() => toggleFeatured(p.id, p.is_featured)}
                        className={`text-xs px-2 py-1 rounded ${p.is_featured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.is_featured ? 'Destaque' : 'Normal'}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/produtos/${p.id}`} className="text-blue-600 hover:underline text-sm">Editar</Link>
                      <button onClick={() => deleteProduct(p.id)} className="text-red-600 hover:underline text-sm">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t flex justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50">Anterior</button>
            <span className="px-3 py-1 text-sm text-gray-600">Pagina {page} de {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50">Proxima</button>
          </div>
        )}
      </div>
    </div>
  );
}
