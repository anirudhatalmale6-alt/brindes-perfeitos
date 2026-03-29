import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import QuoteForm from './QuoteForm';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  initializeDatabase();
  const db = getDb();
  const product = db.prepare(`
    SELECT p.name, p.short_description, p.supplier_sku, p.image_main, c.name as category_name
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = ? AND p.is_active = 1
  `).get(slug) as { name: string; short_description: string | null; supplier_sku: string | null; image_main: string | null; category_name: string | null } | undefined;

  if (!product) return { title: 'Produto nao encontrado' };

  const skuText = product.supplier_sku ? ` - Ref: ${product.supplier_sku}` : '';
  const categoryText = product.category_name ? ` | ${product.category_name}` : '';
  const title = `${product.name} Personalizado${skuText}${categoryText}`;
  const description = product.short_description
    || `${product.name} personalizado e promocional para sua empresa. Adicione ao carrinho.${skuText}`;

  return {
    title,
    description,
    keywords: `${product.name}, ${product.name} personalizado, ${product.name} promocional, brinde personalizado, brinde promocional${product.supplier_sku ? `, ${product.supplier_sku}` : ''}`,
    openGraph: {
      title: `${product.name} - Brinde Promocional Personalizado`,
      description,
      images: product.image_main ? [product.image_main] : undefined,
    },
  };
}

interface DbProduct {
  id: number; name: string; slug: string; supplier: string; supplier_sku: string | null;
  short_description: string | null; description: string | null;
  category_id: number | null; category_name: string | null; category_slug: string | null;
  specs: string | null; colors: string | null; images: string | null;
  image_main: string | null; personalization_techniques: string | null;
  min_order: number | null; units_per_box: number | null;
  box_weight: number | null; box_dimensions: string | null;
  is_active: number; is_featured: number; is_new: number;
  source_url: string | null;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  initializeDatabase();
  const db = getDb();

  const product = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = ? AND p.is_active = 1
  `).get(slug) as DbProduct | undefined;

  if (!product) notFound();

  const specs = product.specs ? JSON.parse(product.specs as string) : {};
  const colors = product.colors ? JSON.parse(product.colors as string) : [];
  const images = product.images ? JSON.parse(product.images as string) : [];
  const techniques = product.personalization_techniques ? JSON.parse(product.personalization_techniques as string) : [];

  // Related products
  const related = db.prepare(`
    SELECT p.*, c.name as category_name FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1 AND p.category_id = ? AND p.id != ?
    ORDER BY RANDOM() LIMIT 4
  `).all(product.category_id, product.id) as DbProduct[];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-lime-600">Inicio</Link>
            <span className="mx-2">/</span>
            <Link href="/catalogo" className="hover:text-lime-600">Catalogo</Link>
            {product.category_name && (
              <>
                <span className="mx-2">/</span>
                <Link href={`/categorias/${product.category_slug}`} className="hover:text-lime-600">
                  {product.category_name}
                </Link>
              </>
            )}
            <span className="mx-2">/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>

          <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Images */}
              <div>
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                  {product.image_main ? (
                    <img src={product.image_main!} alt={product.name}
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.slice(0, 4).map((img: string, i: number) => (
                      <div key={i} className="aspect-square bg-gray-100 rounded overflow-hidden">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div>
                {product.category_name && (
                  <Link href={`/categorias/${product.category_slug}`}
                    className="text-sm text-lime-600 font-medium uppercase">
                    {product.category_name}
                  </Link>
                )}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">{product.name}</h1>

                {product.supplier_sku && (
                  <p className="text-sm text-gray-500 mt-1">Codigo: <strong>{product.supplier_sku}</strong></p>
                )}
                <p className="text-xs text-lime-600 mt-1 font-medium">Brinde Promocional Personalizado</p>

                {product.short_description && (
                  <p className="text-gray-600 mt-4">{product.short_description}</p>
                )}

                {/* Colors */}
                {colors.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Cores Disponiveis</h3>
                    <div className="flex gap-2 flex-wrap">
                      {colors.map((c: { name: string; hex?: string }, i: number) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-700">
                          {c.hex && <span className="inline-block w-3 h-3 rounded-full mr-1 border" style={{ backgroundColor: c.hex }} />}
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specs */}
                {Object.keys(specs).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Especificacoes</h3>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <tbody>
                          {Object.entries(specs).map(([key, value]) => (
                            <tr key={key} className="border-b border-gray-200 last:border-0">
                              <td className="px-4 py-2 font-medium text-gray-600 w-1/3">{key}</td>
                              <td className="px-4 py-2 text-gray-900">{String(value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Personalization */}
                {techniques.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Tecnicas de Personalizacao</h3>
                    <div className="flex gap-2 flex-wrap">
                      {techniques.map((t: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-lime-50 text-lime-700 rounded text-sm">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Packaging */}
                {(product.units_per_box || product.min_order) && (
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Informacoes de Embalagem</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {product.min_order && <div><span className="text-gray-500">Pedido minimo:</span> <span className="font-medium">{product.min_order} un.</span></div>}
                      {product.units_per_box && <div><span className="text-gray-500">Un. por caixa:</span> <span className="font-medium">{product.units_per_box}</span></div>}
                      {product.box_weight && <div><span className="text-gray-500">Peso caixa:</span> <span className="font-medium">{product.box_weight} kg</span></div>}
                      {product.box_dimensions && <div><span className="text-gray-500">Dimensoes caixa:</span> <span className="font-medium">{product.box_dimensions}</span></div>}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-8">
                  <Link href="#carrinho"
                    className="block w-full bg-amber-500 text-white text-center py-3 rounded-lg font-semibold hover:bg-amber-600 text-lg">
                    Adicionar ao Carrinho
                  </Link>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-8 pt-8 border-t">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Descricao</h2>
                <div className="prose max-w-none text-gray-600"
                  dangerouslySetInnerHTML={{ __html: product.description! }} />
              </div>
            )}
          </div>

          {/* Cart Form */}
          <div id="carrinho" className="mt-8">
            <QuoteForm productId={product.id} productName={product.name} />
          </div>

          {/* Related Products */}
          {related.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Produtos Relacionados</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.map(p => (
                  <Link key={p.id} href={`/catalogo/${p.slug}`}
                    className="product-card bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="aspect-square bg-gray-100">
                      {p.image_main ? (
                        <img src={p.image_main} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{p.name}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
