import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default function CategoriesPage() {
  initializeDatabase();
  const db = getDb();

  const categories = db.prepare(`
    SELECT c.*, COUNT(p.id) as product_count FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
    WHERE c.is_active = 1
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.name ASC
  `).all() as { id: number; name: string; slug: string; description: string | null; product_count: number; is_active: number }[];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <nav className="text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-blue-600">Inicio</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Categorias</span>
          </nav>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Categorias de Brindes</h1>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map(cat => (
              <Link key={cat.id} href={`/categorias/${cat.slug}`}
                className="category-card bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md">
                <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{cat.product_count} produtos</p>
                {cat.description && <p className="text-xs text-gray-400 mt-2">{cat.description}</p>}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
