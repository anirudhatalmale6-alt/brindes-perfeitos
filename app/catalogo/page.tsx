'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';

interface Product {
  id: number; name: string; slug: string; image_main: string;
  category_name: string; supplier: string; supplier_sku: string | null; min_order: number | null;
  colors: string | null; units_per_box: number | null; price: number | null;
  is_new: number; is_featured: number;
}

interface Category { id: number; name: string; slug: string; parent_id: number | null; product_count: number; }

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [restoredFromCache, setRestoredFromCache] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const LIMIT = 48;

  // Restore scroll position and cached products when returning from product page
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('catalog_products');
      const cachedScroll = sessionStorage.getItem('catalog_scroll');
      const cachedPage = sessionStorage.getItem('catalog_page');
      const cachedTotal = sessionStorage.getItem('catalog_total');
      if (cached && cachedScroll && !searchParams.get('q')) {
        setProducts(JSON.parse(cached));
        setPage(parseInt(cachedPage || '1'));
        setTotal(parseInt(cachedTotal || '0'));
        setLoading(false);
        setRestoredFromCache(true);
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(cachedScroll));
        });
        // Clear after restoring
        sessionStorage.removeItem('catalog_products');
        sessionStorage.removeItem('catalog_scroll');
        sessionStorage.removeItem('catalog_page');
        sessionStorage.removeItem('catalog_total');
      }
    } catch { /* ignore */ }
  }, [searchParams]);

  // Save scroll position when clicking a product link
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const link = (e.target as HTMLElement).closest('a[href*="/catalogo/"]');
      if (link && products.length > 0) {
        sessionStorage.setItem('catalog_products', JSON.stringify(products));
        sessionStorage.setItem('catalog_scroll', String(window.scrollY));
        sessionStorage.setItem('catalog_page', String(page));
        sessionStorage.setItem('catalog_total', String(total));
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [products, page, total]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset when filters change
  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
  }, [debouncedSearch, selectedCategory]);

  const loadProducts = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);

    const params = new URLSearchParams({
      page: String(pageNum), limit: String(LIMIT), search: debouncedSearch, active: '1',
      category: selectedCategory,
    });
    if (searchParams.get('featured') === '1') params.set('featured', '1');

    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();

    if (append) {
      setProducts(prev => [...prev, ...data.products]);
    } else {
      setProducts(data.products);
    }
    setTotal(data.total);
    setHasMore(pageNum < data.totalPages);
    if (append) setLoadingMore(false); else setLoading(false);
  }, [debouncedSearch, selectedCategory, searchParams]);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories);
  }, []);

  // Load first page when filters change (skip if restored from cache)
  useEffect(() => {
    if (restoredFromCache) {
      setRestoredFromCache(false);
      return;
    }
    loadProducts(1, false);
  }, [loadProducts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load more when page increases beyond 1
  useEffect(() => {
    if (page > 1 && !restoredFromCache) {
      loadProducts(page, true);
    }
  }, [page, loadProducts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setPage(p => p + 1);
        }
      },
      { threshold: 0.1 }
    );

    const el = observerRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, loading, loadingMore]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-lime-600">Inicio</Link>
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
                    onChange={e => setSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>

                {/* Categories */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Categoria</h4>
                  <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">Todas</option>
                    {categories.filter(c => !c.parent_id).map(main => {
                      const subs = categories.filter(c => c.parent_id === main.id);
                      return (
                        <optgroup key={main.id} label={main.name}>
                          <option value={main.id}>Todos ({main.product_count})</option>
                          {subs.map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.name} ({sub.product_count})</option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                {(search || selectedCategory) && (
                  <button onClick={() => { setSearch(''); setSelectedCategory(''); }}
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
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Categoria</option>
                  {categories.filter(c => !c.parent_id).map(main => {
                    const subs = categories.filter(c => c.parent_id === main.id);
                    return (
                      <optgroup key={main.id} label={main.name}>
                        <option value={main.id}>Todos</option>
                        {subs.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </optgroup>
                    );
                  })}
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
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {products.map(p => (
                      <ProductCard key={p.id} {...p} />
                    ))}
                  </div>

                  {/* Infinite scroll trigger */}
                  {hasMore && (
                    <div ref={observerRef} className="flex justify-center py-8">
                      {loadingMore && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span className="text-sm">Carregando mais produtos...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!hasMore && products.length > 0 && (
                    <p className="text-center text-gray-400 text-sm py-6">
                      Mostrando todos os {total} produtos
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
