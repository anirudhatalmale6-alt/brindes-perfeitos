import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';
import { slugify } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * Cleans a product name for SEO short description generation.
 * - Removes SKU prefix (e.g. "11103. " from SpotGifts)
 * - Title-cases the result
 */
function cleanProductName(name: string): string {
  // Remove leading SKU number prefix (e.g. "11103. ")
  let clean = name.replace(/^\d+\.\s*/, '');
  // Title case
  clean = clean
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return clean;
}

export async function POST(request: NextRequest) {
  initializeDatabase();
  const db = getDb();

  const body = await request.json().catch(() => ({}));
  const updateSlugs = body.update_slugs !== false; // default true

  const products = db.prepare(
    'SELECT id, name, supplier_sku, slug FROM products WHERE is_active = 1'
  ).all() as { id: number; name: string; supplier_sku: string | null; slug: string }[];

  let updated = 0;
  const slugMap = new Map<string, number>(); // track used slugs

  // Pre-populate slugMap with existing slugs we won't change
  if (!updateSlugs) {
    for (const p of products) {
      slugMap.set(p.slug, p.id);
    }
  }

  const updateDesc = db.prepare(
    'UPDATE products SET short_description = ?, updated_at = datetime(\'now\') WHERE id = ?'
  );
  const updateDescAndSlug = db.prepare(
    'UPDATE products SET short_description = ?, slug = ?, updated_at = datetime(\'now\') WHERE id = ?'
  );

  const transaction = db.transaction(() => {
    for (const product of products) {
      const cleanName = cleanProductName(product.name);
      const sku = product.supplier_sku || '';

      // Short description: "Name Personalizado CODE Brindes Perfeitos"
      const parts = [cleanName, 'Personalizado'];
      if (sku) parts.push(sku);
      parts.push('Brindes Perfeitos');
      const shortDesc = parts.join(' ');

      if (updateSlugs) {
        // Slug: "name-personalizado-sku" (keep it short)
        const slugParts = [cleanName, 'personalizado'];
        if (sku) slugParts.push(sku);
        let baseSlug = slugify(slugParts.join(' '));
        // Ensure slug isn't too long (max ~80 chars)
        if (baseSlug.length > 80) {
          // Truncate the name part
          const words = cleanName.split(' ').slice(0, 4).join(' ');
          baseSlug = slugify([words, 'personalizado', sku].filter(Boolean).join(' '));
        }

        let finalSlug = baseSlug;
        let counter = 1;
        while (slugMap.has(finalSlug) && slugMap.get(finalSlug) !== product.id) {
          finalSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        slugMap.set(finalSlug, product.id);

        updateDescAndSlug.run(shortDesc, finalSlug, product.id);
      } else {
        updateDesc.run(shortDesc, product.id);
      }
      updated++;
    }
  });

  transaction();

  return NextResponse.json({
    success: true,
    updated,
    message: `Generated SEO descriptions${updateSlugs ? ' and slugs' : ''} for ${updated} products`,
  });
}
