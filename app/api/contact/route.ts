import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';
import { sendQuoteNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiting
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }
  entry.count++;
  return entry.count > 5;
}

export async function POST(request: NextRequest) {
  initializeDatabase();
  const db = getDb();

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Muitas solicitacoes. Tente novamente em alguns minutos.' }, { status: 429 });
  }

  const body = await request.json();

  // Validate required fields
  if (!body.name || !body.company || !body.email || !body.whatsapp) {
    return NextResponse.json({ error: 'Nome, empresa, email e WhatsApp sao obrigatorios' }, { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json({ error: 'Email invalido' }, { status: 400 });
  }

  // Ensure whatsapp column exists (migration for existing DBs)
  try {
    db.exec("ALTER TABLE quote_requests ADD COLUMN whatsapp TEXT");
  } catch {
    // Column already exists
  }

  db.prepare(`
    INSERT INTO quote_requests (product_id, product_name, name, email, phone, company, whatsapp, quantity, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.product_id || null, body.product_name || null,
    body.name, body.email, body.whatsapp, body.company,
    body.whatsapp, body.quantity || null, body.message || null
  );

  // Send email notification (async, non-blocking)
  sendQuoteNotification({
    name: body.name,
    company: body.company,
    email: body.email,
    whatsapp: body.whatsapp,
    product_name: body.product_name || null,
    quantity: body.quantity || null,
    message: body.message || null,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}

export async function GET() {
  initializeDatabase();
  const db = getDb();

  // Ensure whatsapp column exists
  try {
    db.exec("ALTER TABLE quote_requests ADD COLUMN whatsapp TEXT");
  } catch {
    // Column already exists
  }

  const requests = db.prepare(`
    SELECT * FROM quote_requests ORDER BY created_at DESC LIMIT 100
  `).all();
  return NextResponse.json(requests);
}
