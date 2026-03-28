'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';

interface Product {
  id: number; name: string; slug: string; image_main: string;
  category_name: string; supplier: string; is_new: number; is_featured: number;
}

interface Category { id: number; name: string; slug: string; product_count: number; }

export default function CatalogPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Carregando...</div>}>
      <CatalogPage />
    </Suspense>
  );
}

function CatalogPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page), limit: '24', search, active: '1',
      category: selectedCategory, supplier: selectedSupplier,
    });
    if (searchParams.get('featured') === '1') params.set('featured', '1');

    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products);
    setTotal(data.total);
    setLoading(false);
  }, [page, search, selectedCategory, selectedSupplier, searchParams]);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories);
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const totalPages = Math.ceil(total / 24);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-blue-600">Inicio</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Catalogo</span>
          </nav>

          <div className="flex gap-8">
            {/* Sidebar Filters */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
                <h3 className="font-semibold text-gray-900 mb-3">Filtros</h3>

                {/* Search */}
                <div className="mb-4">
                  <input type="text" placeholder="Buscar..." value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>

                {/* Categories */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Categoria</h4>
                  <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">Todas</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.product_count})</option>
                    ))}
                  </select>
                </div>

                {/* Supplier */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Fornecedor</h4>
                  <select value={selectedSupplier} onChange={e => { setSelectedSupplier(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">Todos</option>
                    <option value="spotgifts">SpotGifts</option>
                    <option value="xbzbrindes">XBZ Brindes</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                {(search || selectedCategory || selectedSupplier) && (
                  <button onClick={() => { setSearch(''); setSelectedCategory(''); setSelectedSupplier(''); setPage(1); }}
                    className="text-sm text-red-600 hover:underline">Limpar filtros</button>
                )}
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  Catalogo {total > 0 && <span className="text-gray-500 font-normal text-lg">({total} produtos)</span>}
                </h1>
              </div>

              {/* Mobile filters */}
              <div className="lg:hidden mb-4 flex gap-2">
                <input type="text" placeholder="Buscar..." value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Categoria</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {loading ? (
                <div className="text-center py-16 text-gray-500">Carregando produtos...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-500 text-lg">Nenhum produto encontrado.</p>
                  <p className="text-gray-400 mt-2">Tente alterar os filtros de busca.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map(p => (
                    <ProductCard key={p.id} {...p} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100">Anterior</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = page <= 3 ? i + 1 : page + i - 2;
                    if (p < 1 || p > totalPages) return null;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`px-4 py-2 border rounded-lg text-sm ${page === p ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
                        {p}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100">Proxima</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
