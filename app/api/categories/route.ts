import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { slugify } from '@/lib/utils';

export async function GET() {
  initializeDatabase();
  const db = getDb();
  const categories = db.prepare(`
    SELECT c.*,
      COUNT(DISTINCT p.id) as product_count,
      (SELECT COUNT(*) FROM categories sub WHERE sub.parent_id = c.id) as children_count,
      pc.name as parent_name, pc.slug as parent_slug
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
    LEFT JOIN categories pc ON c.parent_id = pc.id
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.name ASC
  `).all();
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const body = await request.json();
  const slug = slugify(body.name);

  const result = db.prepare(
    'INSERT INTO categories (name, slug, description, image_url, parent_id, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(body.name, slug, body.description || null, body.image_url || null, body.parent_id || null, body.sort_order || 0, body.is_active ?? 1);

  return NextResponse.json({ success: true, id: result.lastInsertRowid });
}

export async function PUT(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const body = await request.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  if (fields.name && !fields.slug) {
    fields.slug = slugify(fields.name);
  }

  const sets = Object.keys(fields).map(k => `${k} = ?`);
  sets.push("updated_at = datetime('now')");
  const params = [...Object.values(fields), id];

  db.prepare(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const { id } = await request.json();
  // Unlink products from this category
  db.prepare('UPDATE products SET category_id = NULL WHERE category_id = ?').run(id);
  // Unlink subcategories (set parent_id to NULL)
  db.prepare('UPDATE categories SET parent_id = NULL WHERE parent_id = ?').run(id);
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
