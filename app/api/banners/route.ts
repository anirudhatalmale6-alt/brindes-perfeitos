import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  initializeDatabase();
  const db = getDb();
  const banners = db.prepare(
    'SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC'
  ).all();
  return NextResponse.json(banners);
}

export async function POST(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const body = await request.json();

  const result = db.prepare(`
    INSERT INTO banners (title, subtitle, image_url, link_url, cta_text, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.title, body.subtitle || null, body.image_url || null,
    body.link_url || null, body.cta_text || null,
    body.sort_order || 0, body.is_active ?? 1
  );

  return NextResponse.json({ success: true, id: result.lastInsertRowid });
}

export async function PUT(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const body = await request.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const sets = Object.keys(fields).map(k => `${k} = ?`);
  sets.push("updated_at = datetime('now')");
  const params = [...Object.values(fields), id];

  db.prepare(`UPDATE banners SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const { id } = await request.json();
  db.prepare('DELETE FROM banners WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
