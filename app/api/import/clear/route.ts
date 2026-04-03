import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  initializeDatabase();
  const db = getDb();

  const body = await request.json().catch(() => ({}));
  const supplier = body.supplier || ''; // 'spotgifts', 'xbzbrindes', or '' for all

  // Enable foreign key cascading
  db.pragma('foreign_keys = ON');

  if (supplier) {
    // Get product IDs for this supplier
    const productIds = db.prepare('SELECT id FROM products WHERE supplier = ?').all(supplier) as { id: number }[];
    const ids = productIds.map(p => p.id);

    if (ids.length > 0) {
      // Delete related records first
      const placeholders = ids.map(() => '?').join(',');
      db.prepare(`DELETE FROM pricing_tiers WHERE product_id IN (${placeholders})`).run(...ids);
      db.prepare(`DELETE FROM product_categories WHERE product_id IN (${placeholders})`).run(...ids);
      db.prepare(`DELETE FROM quote_requests WHERE product_id IN (${placeholders})`).run(...ids);
    }

    const result = db.prepare('DELETE FROM products WHERE supplier = ?').run(supplier);
    return NextResponse.json({
      success: true,
      deleted: result.changes,
      message: `${result.changes} produtos do fornecedor ${supplier} foram excluidos.`,
    });
  } else {
    // Delete all related records first
    db.prepare('DELETE FROM pricing_tiers').run();
    db.prepare('DELETE FROM product_categories').run();
    db.prepare('DELETE FROM quote_requests').run();

    const result = db.prepare('DELETE FROM products').run();
    return NextResponse.json({
      success: true,
      deleted: result.changes,
      message: `Todos os ${result.changes} produtos foram excluidos.`,
    });
  }
}
