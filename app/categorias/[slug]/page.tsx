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
  colors: string | null; units_per_box: number | null; price: number | null;
}

interface Category {
  id: number; name: string; slug: string; parent_id: number | null;
  parent_name: string | null; parent_slug: string | null;
}

const ALL_COLORS = [
  { name: 'PRETO', hex: '#000000' },
  { name: 'BRANCO', hex: '#FFFFFF' },
  { name: 'AZUL', hex: '#3B82F6' },
  { name: 'VERMELHO', hex: '#EF4444' },
  { name: 'VERDE', hex: '#22C55E' },
  { name: 'AMARELO', hex: '#EAB308' },
  { name: 'ROSA', hex: '#EC4899' },
  { name: 'LARANJA', hex: '#F97316' },
  { name: 'ROXO', hex: '#A855F7' },
  { name: 'CINZA', hex: '#6B7280' },
  { name: 'MARROM', hex: '#92400E' },
  { name: 'PRATA', hex: '#C0C0C0' },
  { name: 'DOURADO', hex: '#D4A843' },
];

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<{ id: number; name: string; slug: string; product_count: number }[]>([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [sort, setSort] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const catRes = await fetch('/api/categories');
    const cats = await catRes.json();
    const cat = cats.find((c: Category) => c.slug === slug);

    if (cat) {
      setCategory(cat);
      const subs = cats.filter((c: Category & { product_count: number }) => c.parent_id === cat.id);
      setSubcategories(subs);

      const p = new URLSearchParams({ page: String(page), limit: '24', category: String(cat.id), active: '1' });
      if (selectedColor) p.set('color', selectedColor);
      if (sort) p.set('sort', sort);
      const res = await fetch(`/api/products?${p}`);
      const data = await res.json();
      setProducts(data.products);
      setTotal(data.total);
    }
    setLoading(false);
  }, [slug, page, selectedColor, sort]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalPages = Math.ceil(total / 24);

  function handleColorFilter(color: string) {
    setSelectedColor(prev => prev === color ? '' : color);
    setPage(1);
  }

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
            <div className="flex flex-wrap gap-2 mb-6">
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

          {/* Filters bar */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {/* Sort */}
              <select
                value={sort}
                onChange={e => { setSort(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">Ordenar por</option>
                <option value="name_asc">Nome A-Z</option>
                <option value="name_desc">Nome Z-A</option>
                <option value="newest">Mais recentes</option>
                <option value="stock_desc">Maior estoque</option>
              </select>

              {/* Active filter badge */}
              {selectedColor && (
                <button
                  onClick={() => { setSelectedColor(''); setPage(1); }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-lime-50 text-lime-700 rounded-full text-sm"
                >
                  <span className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                    style={{ backgroundColor: ALL_COLORS.find(c => c.name === selectedColor)?.hex || '#ccc' }} />
                  {selectedColor}
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Color filter - always visible */}
            <div className="pt-3 border-t">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Filtrar por cor</h3>
              <div className="flex flex-wrap gap-2">
                {ALL_COLORS.map(color => (
                  <button
                    key={color.name}
                    onClick={() => handleColorFilter(color.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      selectedColor === color.name
                        ? 'border-lime-500 bg-lime-50 text-lime-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-gray-300 inline-block"
                      style={{ backgroundColor: color.hex }}
                    />
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-500">Carregando...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">Nenhum produto encontrado com esses filtros.</p>
              {selectedColor && (
                <button onClick={() => { setSelectedColor(''); setPage(1); }}
                  className="text-lime-600 hover:underline mt-2 inline-block">Limpar filtros</button>
              )}
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
