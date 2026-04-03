'use client';

import { useEffect, useState, useCallback } from 'react';
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

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [supplier, setSupplier] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkMsg, setBulkMsg] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20', search: debouncedSearch, supplier });
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products);
    setTotal(data.total);
    setLoading(false);
  }, [page, debouncedSearch, supplier]);

  async function loadCategories() {
    const res = await fetch('/api/categories');
    if (res.ok) setCategories(await res.json());
  }

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { loadCategories(); }, []);

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

  function toggleSelect(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map(p => p.id)));
    }
  }

  async function bulkAssignCategory() {
    if (!bulkCategory || selected.size === 0) return;
    setBulkMsg('Atualizando...');
    const ids = Array.from(selected);
    let ok = 0;
    for (const id of ids) {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, category_id: Number(bulkCategory) }),
      });
      if (res.ok) ok++;
    }
    setBulkMsg(`${ok} produtos movidos para a categoria!`);
    setSelected(new Set());
    setBulkCategory('');
    loadProducts();
    setTimeout(() => setBulkMsg(''), 3000);
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Excluir ${selected.size} produtos selecionados?`)) return;
    const ids = Array.from(selected);
    for (const id of ids) {
      await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    }
    setSelected(new Set());
    loadProducts();
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Produtos ({total})</h1>
        <Link href="/admin/produtos/novo" className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 text-sm">
          + Novo Produto
        </Link>
      </div>

      {bulkMsg && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{bulkMsg}</div>
      )}

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-blue-700">{selected.size} produtos selecionados</span>

          <div className="flex items-center gap-2">
            <select
              value={bulkCategory}
              onChange={e => setBulkCategory(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">Mover para categoria...</option>
              {categories.filter(c => !c.parent_id).map(cat => (
                <optgroup key={cat.id} label={cat.name}>
                  <option value={cat.id}>{cat.name}</option>
                  {categories.filter(sub => sub.parent_id === cat.id).map(sub => (
                    <option key={sub.id} value={sub.id}>  {sub.name}</option>
                  ))}
                </optgroup>
              ))}
              {categories.filter(c => c.parent_id).length === 0 && categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button
              onClick={bulkAssignCategory}
              disabled={!bulkCategory}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Mover
            </button>
          </div>

          <button
            onClick={bulkDelete}
            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700"
          >
            Excluir selecionados
          </button>

          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Limpar selecao
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b flex gap-4">
          <input
            type="text" placeholder="Buscar produtos..." value={search}
            onChange={e => setSearch(e.target.value)}
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
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === products.length && products.length > 0}
                    onChange={selectAll}
                    className="rounded"
                  />
                </th>
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
                <tr key={p.id} className={`border-b hover:bg-gray-50 ${selected.has(p.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {p.image_main ? (
                      <img src={p.image_main} alt="" className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">Sem img</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/produtos/${p.id}`} className="text-lime-600 hover:underline font-medium text-sm">
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
                      <Link href={`/admin/produtos/${p.id}`} className="text-lime-600 hover:underline text-sm">Editar</Link>
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
