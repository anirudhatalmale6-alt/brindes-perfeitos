import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  initializeDatabase();
  const db = getDb();

  const body = await request.json().catch(() => ({}));
  const supplier = body.supplier || ''; // 'spotgifts', 'xbzbrindes', or '' for all

  if (supplier) {
    const result = db.prepare('DELETE FROM products WHERE supplier = ?').run(supplier);
    return NextResponse.json({
      success: true,
      deleted: result.changes,
      message: `${result.changes} produtos do fornecedor ${supplier} foram excluidos.`,
    });
  } else {
    const result = db.prepare('DELETE FROM products').run();
    return NextResponse.json({
      success: true,
      deleted: result.changes,
      message: `Todos os ${result.changes} produtos foram excluidos.`,
    });
  }
}
