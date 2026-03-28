import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const body = await request.json();

  if (!body.name || !body.email) {
    return NextResponse.json({ error: 'Nome e email sao obrigatorios' }, { status: 400 });
  }

  db.prepare(`
    INSERT INTO quote_requests (product_id, product_name, name, email, phone, company, quantity, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.product_id || null, body.product_name || null,
    body.name, body.email, body.phone || null, body.company || null,
    body.quantity || null, body.message || null
  );

  return NextResponse.json({ success: true });
}

export async function GET() {
  initializeDatabase();
  const db = getDb();
  const requests = db.prepare(`
    SELECT * FROM quote_requests ORDER BY created_at DESC LIMIT 100
  `).all();
  return NextResponse.json(requests);
}
