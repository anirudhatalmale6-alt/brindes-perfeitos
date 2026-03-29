import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface DbCategory {
  id: number; name: string; slug: string; description: string | null;
  parent_id: number | null; product_count: number; is_active: number;
}

export default function CategoriesPage() {
  initializeDatabase();
  const db = getDb();

  const allCategories = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) as product_count
    FROM categories c
    WHERE c.is_active = 1
    ORDER BY c.sort_order ASC, c.name ASC
  `).all() as DbCategory[];

  const mainCategories = allCategories.filter(c => !c.parent_id);

  // For each main category, also count products in subcategories
  function getTotalProducts(mainId: number): number {
    const subs = allCategories.filter(c => c.parent_id === mainId);
    return allCategories.find(c => c.id === mainId)!.product_count + subs.reduce((sum, s) => sum + s.product_count, 0);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <nav className="text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-lime-600">Inicio</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Categorias</span>
          </nav>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Categorias de Brindes</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mainCategories.map(cat => {
              const subcategories = allCategories.filter(c => c.parent_id === cat.id);
              const totalProducts = getTotalProducts(cat.id);

              return (
                <div key={cat.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <Link href={`/categorias/${cat.slug}`} className="block p-6">
                    <div className="w-16 h-16 bg-lime-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-center text-lg">{cat.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 text-center">{totalProducts} produtos</p>
                    {cat.description && <p className="text-xs text-gray-400 mt-2 text-center">{cat.description}</p>}
                  </Link>

                  {subcategories.length > 0 && (
                    <div className="border-t px-6 py-3 bg-gray-50">
                      <div className="flex flex-wrap gap-2">
                        {subcategories.map(sub => (
                          <Link key={sub.id} href={`/categorias/${sub.slug}`}
                            className="text-xs text-lime-700 bg-lime-50 px-2 py-1 rounded hover:bg-lime-100 transition-colors">
                            {sub.name} ({sub.product_count})
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
