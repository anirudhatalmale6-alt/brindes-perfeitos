import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';
import { generateQuotePDF } from '@/lib/pdf-quote';
import { sendCartQuoteEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Rate limiting
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

interface CartItem {
  id: number;
  name: string;
  supplier_sku: string | null;
  category_name: string | null;
  quantity: number;
  unit_price: number | null;
}

export async function POST(request: NextRequest) {
  initializeDatabase();
  const db = getDb();

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Muitas solicitacoes. Tente novamente em alguns minutos.' }, { status: 429 });
  }

  const body = await request.json();

  if (!body.name || !body.company || !body.email || !body.whatsapp) {
    return NextResponse.json({ error: 'Nome, empresa, email e WhatsApp sao obrigatorios' }, { status: 400 });
  }
  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json({ error: 'Email invalido' }, { status: 400 });
  }

  const items: CartItem[] = body.items;

  // Ensure columns exist
  try { db.exec("ALTER TABLE quote_requests ADD COLUMN whatsapp TEXT"); } catch {}
  try { db.exec("ALTER TABLE quote_requests ADD COLUMN order_id TEXT"); } catch {}
  try { db.exec("ALTER TABLE quote_requests ADD COLUMN unit_price REAL"); } catch {}

  // Generate order ID for this cart submission
  const quoteNumber = `BP-${Date.now().toString(36).toUpperCase()}`;

  // Save each item as a quote request with same order_id
  const insertStmt = db.prepare(`
    INSERT INTO quote_requests (product_id, product_name, name, email, phone, company, whatsapp, quantity, unit_price, message, order_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const productNames: string[] = [];
  for (const item of items) {
    productNames.push(`${item.name}${item.supplier_sku ? ` (${item.supplier_sku})` : ''} x${item.quantity}`);
    insertStmt.run(
      item.id, item.name,
      body.name, body.email, body.whatsapp, body.company, body.whatsapp,
      item.quantity, item.unit_price || null, body.message || null, quoteNumber
    );
  }
  const pdfBuffer = generateQuotePDF({
    quoteNumber,
    customerName: body.name,
    customerCompany: body.company,
    customerEmail: body.email,
    customerWhatsApp: body.whatsapp,
    message: body.message || null,
    items,
  });

  // Send email with PDF
  sendCartQuoteEmail({
    quoteNumber,
    name: body.name,
    company: body.company,
    email: body.email,
    whatsapp: body.whatsapp,
    message: body.message || null,
    items,
    pdfBuffer,
  }).catch(() => {});

  return NextResponse.json({ success: true, quoteNumber });
}
