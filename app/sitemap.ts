import { MetadataRoute } from 'next';
import { getDb } from '@/lib/db';
import { initializeDatabase } from '@/lib/schema';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Regenerate every hour

export default function sitemap(): MetadataRoute.Sitemap {
  initializeDatabase();
  const db = getDb();
  const baseUrl = 'https://brindesperfeitos.com.br';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/catalogo`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/categorias`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/sobre`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/contato`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/carrinho`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
  ];

  // Category pages
  const categories = db.prepare(
    "SELECT slug, updated_at FROM categories WHERE (SELECT COUNT(*) FROM products WHERE category_id = categories.id AND is_active = 1) > 0"
  ).all() as { slug: string; updated_at: string | null }[];

  const categoryPages: MetadataRoute.Sitemap = categories.map(c => ({
    url: `${baseUrl}/categorias/${c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Product pages
  const products = db.prepare(
    "SELECT slug, updated_at FROM products WHERE is_active = 1"
  ).all() as { slug: string; updated_at: string | null }[];

  const productPages: MetadataRoute.Sitemap = products.map(p => ({
    url: `${baseUrl}/catalogo/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
