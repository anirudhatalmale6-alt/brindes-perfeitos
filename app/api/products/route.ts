import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { slugify } from '@/lib/utils';

export async function GET(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const url = request.nextUrl;
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '24');
  const search = url.searchParams.get('search') || '';
  const category = url.searchParams.get('category') || '';
  const supplier = url.searchParams.get('supplier') || '';
  const active = url.searchParams.get('active');
  const featured = url.searchParams.get('featured');
  const offset = (page - 1) * limit;

  let where = '1=1';
  const params: unknown[] = [];

  if (search) {
    where += ' AND (p.name LIKE ? OR p.supplier_sku LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    // Include products from subcategories when filtering by parent category
    const subCatIds = db.prepare('SELECT id FROM categories WHERE parent_id = ?').all(category) as { id: number }[];
    const allCatIds = [Number(category), ...subCatIds.map(s => s.id)];
    const placeholders = allCatIds.map(() => '?').join(',');
    where += ` AND (p.category_id IN (${placeholders}) OR pc.category_id IN (${placeholders}))`;
    params.push(...allCatIds, ...allCatIds);
  }
  if (supplier) {
    where += ' AND p.supplier = ?';
    params.push(supplier);
  }
  if (active !== null && active !== '') {
    where += ' AND p.is_active = ?';
    params.push(active);
  }
  if (featured === '1') {
    where += ' AND p.is_featured = 1';
  }

  const countResult = db.prepare(`
    SELECT COUNT(DISTINCT p.id) as total FROM products p
    LEFT JOIN product_categories pc ON p.id = pc.product_id
    WHERE ${where}
  `).get(...params) as { total: number };

  const products = db.prepare(`
    SELECT DISTINCT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_categories pc ON p.id = pc.product_id
    WHERE ${where}
    ORDER BY p.is_featured DESC, p.sort_order ASC, p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  return NextResponse.json({
    products,
    total: countResult.total,
    page,
    totalPages: Math.ceil(countResult.total / limit),
  });
}

export async function POST(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const body = await request.json();

  const slug = slugify(body.name);
  // Ensure unique slug
  let finalSlug = slug;
  let counter = 1;
  while (db.prepare('SELECT id FROM products WHERE slug = ?').get(finalSlug)) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  const result = db.prepare(`
    INSERT INTO products (supplier, supplier_sku, name, slug, short_description, description, category_id,
      specs, colors, image_main, images, min_order, units_per_box, box_weight, box_dimensions,
      personalization_techniques, print_colors_max, is_active, is_featured, is_new, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.supplier || 'manual', body.supplier_sku || null, body.name, finalSlug,
    body.short_description || null, body.description || null, body.category_id || null,
    body.specs ? JSON.stringify(body.specs) : null,
    body.colors ? JSON.stringify(body.colors) : null,
    body.image_main || null,
    body.images ? JSON.stringify(body.images) : null,
    body.min_order || null, body.units_per_box || null, body.box_weight || null,
    body.box_dimensions || null,
    body.personalization_techniques ? JSON.stringify(body.personalization_techniques) : null,
    body.print_colors_max || null,
    body.is_active ?? 1, body.is_featured ?? 0, body.is_new ?? 0,
    body.source_url || null
  );

  return NextResponse.json({ success: true, id: result.lastInsertRowid });
}

export async function PUT(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const body = await request.json();
  const { id, ...fields } = body;

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, value] of Object.entries(fields)) {
    if (['specs', 'colors', 'images', 'personalization_techniques'].includes(key) && typeof value === 'object') {
      sets.push(`${key} = ?`);
      params.push(JSON.stringify(value));
    } else {
      sets.push(`${key} = ?`);
      params.push(value);
    }
  }

  sets.push("updated_at = datetime('now')");
  params.push(id);

  db.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const { id } = await request.json();
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
