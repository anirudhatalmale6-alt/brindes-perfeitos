import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductActions from './ProductActions';
import ImageGallery from '@/components/products/ImageGallery';
import InlineEditor from '@/components/products/InlineEditor';
import AdminBar from '@/components/products/AdminBar';
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

  const skuText = product.supplier_sku ? ` - COD: ${product.supplier_sku}` : '';
  const categoryText = product.category_name ? ` | ${product.category_name}` : '';
  const title = `${product.name} Personalizado${skuText}${categoryText} | Brindes Perfeitos`;

  const description = product.short_description
    ? `${product.short_description} Brinde personalizado com melhor qualidade e melhor preco.${skuText}`
    : `${product.name} personalizado e promocional para sua empresa. Melhor qualidade e melhor preco. Solicite seu orcamento!${skuText}`;

  // Auto-generated SEO keywords
  const keywords = [
    product.name,
    `${product.name} personalizado`,
    `${product.name} personalizada`,
    `${product.name} promocional`,
    `${product.name} corporativo`,
    `${product.name} brinde`,
    product.supplier_sku || '',
    product.category_name ? `${product.category_name} personalizado` : '',
    product.category_name ? `${product.category_name} promocional` : '',
    'brinde personalizado',
    'brinde promocional',
    'brinde corporativo',
    'brinde empresarial',
    'melhor qualidade',
    'melhor preco',
    'brindes perfeitos',
  ].filter(Boolean).join(', ');

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `https://brindesperfeitos.com.br/catalogo/${slug}`,
    },
    openGraph: {
      title: `${product.name} - Brinde Personalizado | Melhor Qualidade e Preco`,
      description,
      images: product.image_main ? [{ url: product.image_main, alt: product.name }] : undefined,
      siteName: 'Brindes Perfeitos',
      type: 'article',
      url: `https://brindesperfeitos.com.br/catalogo/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} - Brinde Personalizado`,
      description,
      images: product.image_main ? [product.image_main] : undefined,
    },
  };
}

interface DbProduct {
  id: number; name: string; slug: string; supplier: string; supplier_sku: string | null;
  short_description: string | null; description: string | null;
  category_id: number | null; category_name: string | null; category_slug: string | null;
  specs: string | null; colors: string | null; color_stock: string | null; images: string | null;
  image_main: string | null; personalization_techniques: string | null;
  min_order: number | null; units_per_box: number | null;
  box_weight: number | null; box_dimensions: string | null;
  price: number | null;
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
  const colorStock: Record<string, number> = product.color_stock ? JSON.parse(product.color_stock as string) : {};
  const images = product.images ? JSON.parse(product.images as string) : [];
  const techniques = product.personalization_techniques ? JSON.parse(product.personalization_techniques as string) : [];

  // Pricing tiers
  const pricingTiers = db.prepare(
    'SELECT min_qty, unit_price FROM pricing_tiers WHERE product_id = ? ORDER BY min_qty ASC'
  ).all(product.id) as { min_qty: number; unit_price: number }[];

  // Related products
  const related = db.prepare(`
    SELECT p.*, c.name as category_name FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1 AND p.category_id = ? AND p.id != ?
    ORDER BY RANDOM() LIMIT 4
  `).all(product.category_id, product.id) as DbProduct[];

  // JSON-LD Structured Data
  const baseUrl = 'https://brindesperfeitos.com.br';
  const productUrl = `${baseUrl}/catalogo/${product.slug}`;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.short_description || `${product.name} - Brinde promocional personalizado`,
    image: product.image_main ? [product.image_main, ...images.slice(0, 4)] : undefined,
    sku: product.supplier_sku || undefined,
    brand: {
      '@type': 'Brand',
      name: product.supplier || 'Brindes Perfeitos',
    },
    url: productUrl,
    category: product.category_name || 'Brindes Promocionais',
    ...(pricingTiers.length > 0 ? {
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'BRL',
        lowPrice: Math.min(...pricingTiers.map(t => t.unit_price)).toFixed(2),
        highPrice: Math.max(...pricingTiers.map(t => t.unit_price)).toFixed(2),
        offerCount: pricingTiers.length,
        availability: product.units_per_box && product.units_per_box > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/PreOrder',
        seller: {
          '@type': 'Organization',
          name: 'Brindes Perfeitos',
        },
      },
    } : {
      offers: {
        '@type': 'Offer',
        priceCurrency: 'BRL',
        price: '0',
        availability: 'https://schema.org/PreOrder',
        seller: {
          '@type': 'Organization',
          name: 'Brindes Perfeitos',
        },
      },
    }),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Categorias', item: `${baseUrl}/categorias` },
      ...(product.category_name ? [{
        '@type': 'ListItem', position: 3, name: product.category_name,
        item: `${baseUrl}/categorias/${product.category_slug}`,
      }] : []),
      {
        '@type': 'ListItem',
        position: product.category_name ? 4 : 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-lime-600">Inicio</Link>
            <span className="mx-2">/</span>
            <Link href="/categorias" className="hover:text-lime-600">Categorias</Link>
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

          <AdminBar productId={product.id} productName={product.name} />
          <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Images */}
              <div>
                <ImageGallery
                  mainImage={product.image_main}
                  images={images}
                  productName={product.name}
                />
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

                {/* Pricing Tiers Table */}
                {pricingTiers.length > 0 && (
                  <div className="mt-4 bg-green-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Tabela de Precos</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="pb-1">Quantidade</th>
                          <th className="pb-1 text-right">Preco Unitario</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricingTiers.map((tier, i) => (
                          <tr key={i} className="border-t border-green-200">
                            <td className="py-1.5 font-medium">A partir de {tier.min_qty} un.</td>
                            <td className="py-1.5 text-right font-bold text-green-700">
                              R$ {tier.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Stock */}
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  {product.units_per_box && product.units_per_box > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Disponivel: {product.units_per_box.toLocaleString('pt-BR')} un.
                    </span>
                  )}
                </div>

                {product.short_description && (
                  <p className="text-gray-600 mt-4">{product.short_description}</p>
                )}
                <InlineEditor productId={product.id} field="short_description" value={product.short_description || ''} label="Descricao Curta" />

                {/* Colors with per-color stock */}
                {colors.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Cores Disponiveis</h3>
                    {Object.keys(colorStock).length > 0 ? (
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500 border-b">
                              <th className="px-3 py-2">Cor</th>
                              <th className="px-3 py-2 text-right">Estoque</th>
                            </tr>
                          </thead>
                          <tbody>
                            {colors.map((c: { name: string; hex?: string }, i: number) => {
                              const stock = colorStock[c.name] || 0;
                              return (
                                <tr key={i} className="border-b border-gray-200 last:border-0">
                                  <td className="px-3 py-2 flex items-center gap-2">
                                    {c.hex && <span className="inline-block w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: c.hex }} />}
                                    <span>{c.name}</span>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {stock > 0 ? (
                                      <span className="text-green-700 font-medium">{stock.toLocaleString('pt-BR')} un.</span>
                                    ) : (
                                      <span className="text-red-500">Indisponivel</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        {colors.map((c: { name: string; hex?: string }, i: number) => (
                          <span key={i} className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-700">
                            {c.hex && <span className="inline-block w-3 h-3 rounded-full mr-1 border" style={{ backgroundColor: c.hex }} />}
                            {c.name}
                          </span>
                        ))}
                      </div>
                    )}
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
                {(product.min_order || product.box_weight || product.box_dimensions) && (
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Informacoes de Embalagem</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {product.min_order && <div><span className="text-gray-500">Pedido minimo:</span> <span className="font-medium">{product.min_order} un.</span></div>}
                      {product.box_weight && <div><span className="text-gray-500">Peso caixa:</span> <span className="font-medium">{product.box_weight} kg</span></div>}
                      {product.box_dimensions && <div><span className="text-gray-500">Dimensoes caixa:</span> <span className="font-medium">{product.box_dimensions}</span></div>}
                    </div>
                  </div>
                )}

                {/* Add to Cart */}
                <ProductActions product={{
                  id: product.id, name: product.name, slug: product.slug,
                  image_main: product.image_main, supplier_sku: product.supplier_sku,
                  category_name: product.category_name, min_order: product.min_order,
                  unit_price: pricingTiers.length > 0 ? pricingTiers[0].unit_price : null,
                }} />
              </div>
            </div>

            {/* Description */}
            <div className="mt-8 pt-8 border-t">
              {product.description && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Descricao</h2>
                  <div className="prose max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ __html: product.description! }} />
                </>
              )}
              <InlineEditor productId={product.id} field="description" value={product.description || ''} label="Descricao" multiline />
            </div>
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
                        <img src={p.image_main} alt={`${p.name} - Brinde Personalizado`} className="w-full h-full object-cover" loading="lazy" />
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
