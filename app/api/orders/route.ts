import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  initializeDatabase();
  const db = getDb();

  // Ensure columns exist
  try { db.exec("ALTER TABLE quote_requests ADD COLUMN order_id TEXT"); } catch {}
  try { db.exec("ALTER TABLE quote_requests ADD COLUMN unit_price REAL"); } catch {}

  const status = request.nextUrl.searchParams.get('status') || '';

  // Get all quote requests ordered by date
  let where = '1=1';
  const params: unknown[] = [];
  if (status) {
    where += ' AND q.status = ?';
    params.push(status);
  }

  const rows = db.prepare(`
    SELECT q.* FROM quote_requests q WHERE ${where} ORDER BY q.created_at DESC
  `).all(...params) as {
    id: number; product_id: number; product_name: string;
    name: string; email: string; phone: string; whatsapp: string; company: string;
    quantity: number; unit_price: number | null; message: string; status: string;
    created_at: string; order_id: string | null;
  }[];

  // Group by order_id or by (email + created_at within 5 seconds)
  const orderMap = new Map<string, typeof rows>();

  for (const row of rows) {
    let key = row.order_id;
    if (!key) {
      // Legacy: group by email + timestamp (within same minute)
      const dateMin = row.created_at ? row.created_at.substring(0, 16) : 'unknown';
      key = `legacy-${row.email}-${dateMin}`;
    }
    if (!orderMap.has(key)) orderMap.set(key, []);
    orderMap.get(key)!.push(row);
  }

  const orders = Array.from(orderMap.entries()).map(([orderId, items]) => {
    const first = items[0];
    const totalQty = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const totalValue = items.reduce((sum, i) => sum + (i.unit_price || 0) * (i.quantity || 0), 0);

    return {
      order_id: orderId,
      name: first.name,
      email: first.email,
      company: first.company,
      whatsapp: first.whatsapp || first.phone,
      message: first.message,
      status: first.status,
      created_at: first.created_at,
      items: items.map(i => ({
        id: i.id,
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
      total_items: items.length,
      total_qty: totalQty,
      total_value: totalValue,
    };
  });

  return NextResponse.json({ orders });
}

export async function PUT(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const body = await request.json();
  const { order_id, status } = body;

  if (!order_id || !status) {
    return NextResponse.json({ error: 'order_id and status required' }, { status: 400 });
  }

  // Update all items in this order
  if (order_id.startsWith('legacy-')) {
    // Legacy grouping: update by email + minute match
    const parts = order_id.replace('legacy-', '').split('-');
    const email = parts.slice(0, -2).join('-'); // email may contain hyphens
    const datePrefix = parts.slice(-2).join('-');
    db.prepare(`
      UPDATE quote_requests SET status = ? WHERE email = ? AND created_at LIKE ?
    `).run(status, email, `${datePrefix}%`);
  } else {
    db.prepare('UPDATE quote_requests SET status = ? WHERE order_id = ?').run(status, order_id);
  }

  return NextResponse.json({ success: true });
}
