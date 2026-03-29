'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';

interface Product {
  id: number; name: string; slug: string; image_main: string;
  category_name: string; supplier: string; supplier_sku: string | null;
  min_order: number | null; is_new: number; is_featured: number;
}

interface Category {
  id: number; name: string; slug: string; parent_id: number | null;
  parent_name: string | null; parent_slug: string | null;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<{ id: number; name: string; slug: string; product_count: number }[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const catRes = await fetch('/api/categories');
    const cats = await catRes.json();
    const cat = cats.find((c: Category) => c.slug === slug);

    if (cat) {
      setCategory(cat);

      // Find subcategories if this is a parent category
      const subs = cats.filter((c: Category & { product_count: number }) => c.parent_id === cat.id);
      setSubcategories(subs);

      // Load products (API will include subcategory products for parent categories)
      const p = new URLSearchParams({ page: String(page), limit: '24', category: String(cat.id), active: '1' });
      const res = await fetch(`/api/products?${p}`);
      const data = await res.json();
      setProducts(data.products);
      setTotal(data.total);
    }
    setLoading(false);
  }, [slug, page]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalPages = Math.ceil(total / 24);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <nav className="text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-lime-600">Inicio</Link>
            <span className="mx-2">/</span>
            <Link href="/categorias" className="hover:text-lime-600">Categorias</Link>
            {category?.parent_name && (
              <>
                <span className="mx-2">/</span>
                <Link href={`/categorias/${category.parent_slug}`} className="hover:text-lime-600">
                  {category.parent_name}
                </Link>
              </>
            )}
            <span className="mx-2">/</span>
            <span className="text-gray-900">{category?.name || ''}</span>
          </nav>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{category?.name || ''}</h1>
          <p className="text-gray-500 mb-6">{total} produtos encontrados</p>

          {/* Subcategory navigation */}
          {subcategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <Link href={`/categorias/${slug}`}
                className="px-4 py-2 rounded-full text-sm font-medium bg-lime-600 text-white">
                Todos ({total})
              </Link>
              {subcategories.map(sub => (
                <Link key={sub.id} href={`/categorias/${sub.slug}`}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:border-lime-500 hover:text-lime-600 transition-colors">
                  {sub.name} ({sub.product_count})
                </Link>
              ))}
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 text-gray-500">Carregando...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">Nenhum produto nesta categoria ainda.</p>
              <Link href="/catalogo" className="text-lime-600 hover:underline mt-2 inline-block">Ver todo o catalogo</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(p => <ProductCard key={p.id} {...p} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50">Anterior</button>
              <span className="px-4 py-2 text-sm text-gray-600">Pagina {page} de {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50">Proxima</button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
