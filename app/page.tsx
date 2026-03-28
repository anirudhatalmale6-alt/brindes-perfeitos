import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface HomeProduct {
  id: number; name: string; slug: string; image_main: string | null;
  category_name: string | null; is_new: number; is_featured: number;
}

interface HomeCategory {
  id: number; name: string; slug: string; product_count: number;
}

function getData() {
  initializeDatabase();
  const db = getDb();

  const featuredProducts = db.prepare(`
    SELECT p.*, c.name as category_name FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1 AND p.is_featured = 1
    ORDER BY p.sort_order ASC LIMIT 8
  `).all() as HomeProduct[];

  const newProducts = db.prepare(`
    SELECT p.*, c.name as category_name FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1 AND p.is_new = 1
    ORDER BY p.created_at DESC LIMIT 8
  `).all() as HomeProduct[];

  const categories = db.prepare(`
    SELECT c.*, COUNT(p.id) as product_count FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
    WHERE c.is_active = 1
    GROUP BY c.id
    ORDER BY c.sort_order ASC
  `).all() as HomeCategory[];

  const totalProducts = (db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as { count: number }).count;

  return { featuredProducts, newProducts, categories, totalProducts };
}

export default function Home() {
  const { featuredProducts, newProducts, categories, totalProducts } = getData();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="hero-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Brindes Promocionais Personalizados</h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Encontre o brinde perfeito para sua empresa. Mais de {totalProducts > 0 ? totalProducts.toLocaleString('pt-BR') : '1.000'} produtos dos melhores fornecedores do Brasil.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/catalogo" className="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 text-lg">
              Ver Catalogo
            </Link>
            <Link href="/contato" className="bg-amber-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-600 text-lg">
              Solicitar Orcamento
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Categorias</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/categorias/${cat.slug}`}
                className="category-card bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md">
                <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{cat.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{cat.product_count} produtos</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Produtos em Destaque</h2>
              <Link href="/catalogo?featured=1" className="text-blue-600 hover:underline font-medium">Ver todos</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredProducts.map((p) => (
                <Link key={p.id} href={`/catalogo/${p.slug}`}
                  className="product-card bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="aspect-square bg-gray-100 relative">
                    {p.image_main ? (
                      <img src={p.image_main} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded">Destaque</span>
                  </div>
                  <div className="p-3">
                    <span className="text-xs text-blue-600 font-medium">{(p.category_name) || 'Brindes'}</span>
                    <h3 className="text-sm font-medium text-gray-900 mt-1 line-clamp-2">{p.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Products */}
      {newProducts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Novidades</h2>
              <Link href="/catalogo" className="text-blue-600 hover:underline font-medium">Ver todos</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {newProducts.map((p) => (
                <Link key={p.id} href={`/catalogo/${p.slug}`}
                  className="product-card bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="aspect-square bg-gray-100 relative">
                    {p.image_main ? (
                      <img src={p.image_main} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded">Novo</span>
                  </div>
                  <div className="p-3">
                    <span className="text-xs text-blue-600 font-medium">{(p.category_name) || 'Brindes'}</span>
                    <h3 className="text-sm font-medium text-gray-900 mt-1 line-clamp-2">{p.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Precisa de brindes para sua empresa?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Entre em contato conosco e receba um orcamento personalizado para seus brindes promocionais.
          </p>
          <Link href="/contato" className="bg-amber-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-600 text-lg inline-block">
            Solicitar Orcamento Gratis
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
