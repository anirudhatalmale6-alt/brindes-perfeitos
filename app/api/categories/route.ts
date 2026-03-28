import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { slugify } from '@/lib/utils';

export async function GET() {
  initializeDatabase();
  const db = getDb();
  const categories = db.prepare(`
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
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
  db.prepare('UPDATE products SET category_id = NULL WHERE category_id = ?').run(id);
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
