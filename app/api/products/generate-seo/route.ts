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

/**
 * Extracts capacity/size specs from a product name.
 * Matches patterns like "650ml", "500 ml", "16GB", "1000 mAh", "A5", "A4"
 */
function extractSpecs(name: string): string {
  const patterns = [
    /(\d+(?:[.,]\d+)?\s*(?:ml|mL|ML|l|L|litro|litros))/gi,
    /(\d+(?:[.,]\d+)?\s*(?:gb|GB|mb|MB|tb|TB))/gi,
    /(\d+(?:[.,]\d+)?\s*(?:mAh|mah|MAH))/gi,
    /(\d+(?:[.,]\d+)?\s*(?:cm|mm|m\b|pol|polegadas))/gi,
    /(\d+(?:[.,]\d+)?(?:'|''|"|″)\s*\d*)/g,
    /\b(A[3-6])\b/g,
  ];

  const found: string[] = [];
  for (const pat of patterns) {
    const matches = name.match(pat);
    if (matches) found.push(...matches);
  }

  return found.length > 0 ? found[0].trim() : '';
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
      const specs = extractSpecs(product.name);

      // Build short description: "Name Personalizado CODE Specs Brindes Perfeitos"
      const parts = [cleanName, 'Personalizado'];
      if (sku) parts.push(sku);
      if (specs) parts.push(specs);
      parts.push('Brindes Perfeitos');
      const shortDesc = parts.join(' ');

      if (updateSlugs) {
        // Build SEO-friendly slug from short description
        let baseSlug = slugify(shortDesc);
        // Ensure slug isn't too long (max ~80 chars)
        if (baseSlug.length > 80) {
          const shortParts = [cleanName, 'personalizado'];
          if (sku) shortParts.push(sku);
          baseSlug = slugify(shortParts.join(' '));
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
