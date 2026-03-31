import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CategoryStrip from '@/components/layout/CategoryStrip';
import HeroBanner from '@/components/layout/HeroBanner';
import ProductCard from '@/components/products/ProductCard';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface HomeProduct {
  id: number; name: string; slug: string; image_main: string | null;
  category_name: string | null; supplier_sku: string | null; min_order: number | null;
  colors: string | null; units_per_box: number | null; price: number | null;
  is_new: number; is_featured: number;
}

interface HomeCategory {
  id: number; name: string; slug: string; parent_id: number | null; product_count: number;
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

      {/* Hero Banner Slider */}
      <HeroBanner totalProducts={totalProducts} />

      {/* Category Strip */}
      <CategoryStrip categories={categories} />

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Produtos em Destaque</h2>
              <Link href="/catalogo?featured=1" className="text-lime-600 hover:underline font-medium">Ver todos</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} {...p} supplier_sku={p.supplier_sku} />
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
              <Link href="/catalogo" className="text-lime-600 hover:underline font-medium">Ver todos</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {newProducts.map((p) => (
                <ProductCard key={p.id} {...p} supplier_sku={p.supplier_sku} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-lime-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Precisa de brindes para sua empresa?</h2>
          <p className="text-lime-100 mb-8 text-lg">
            Monte seu carrinho de brindes personalizados e receba seu orcamento rapidamente.
          </p>
          <Link href="/carrinho" className="bg-amber-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-600 text-lg inline-block">
            Ver Meu Carrinho
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
