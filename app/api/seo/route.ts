import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  initializeDatabase();
  const db = getDb();
  const settings = db.prepare('SELECT * FROM seo_settings ORDER BY page_path').all();
  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const body = await request.json();

  const { page_path, page_title, meta_description, meta_keywords, og_image } = body;

  if (!page_path) {
    return NextResponse.json({ error: 'page_path required' }, { status: 400 });
  }

  db.prepare(`
    INSERT INTO seo_settings (page_path, page_title, meta_description, meta_keywords, og_image)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(page_path) DO UPDATE SET
      page_title = excluded.page_title,
      meta_description = excluded.meta_description,
      meta_keywords = excluded.meta_keywords,
      og_image = excluded.og_image,
      updated_at = datetime('now')
  `).run(page_path, page_title || null, meta_description || null, meta_keywords || null, og_image || null);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const { id } = await request.json();
  db.prepare('DELETE FROM seo_settings WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
