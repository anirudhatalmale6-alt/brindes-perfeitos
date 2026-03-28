import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const q = request.nextUrl.searchParams.get('q') || '';
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const products = db.prepare(`
    SELECT p.id, p.name, p.slug, p.image_main, p.supplier_sku, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1 AND (p.name LIKE ? OR p.supplier_sku LIKE ? OR p.short_description LIKE ?)
    ORDER BY p.is_featured DESC, p.name ASC
    LIMIT ?
  `).all(`%${q}%`, `%${q}%`, `%${q}%`, limit);

  return NextResponse.json(products);
}
