import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Get pricing tiers for a product (or all)
export async function GET(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const productId = request.nextUrl.searchParams.get('product_id');

  if (productId) {
    const tiers = db.prepare(
      'SELECT * FROM pricing_tiers WHERE product_id = ? ORDER BY min_qty ASC'
    ).all(Number(productId));
    return NextResponse.json({ tiers });
  }

  // Return all products with their tier counts
  const products = db.prepare(`
    SELECT p.id, p.name, p.supplier_sku, p.price as cost_price,
      (SELECT COUNT(*) FROM pricing_tiers pt WHERE pt.product_id = p.id) as tier_count
    FROM products p WHERE p.is_active = 1
    ORDER BY p.name ASC
  `).all();
  return NextResponse.json({ products });
}

// POST: Set pricing tiers for a product (replaces existing)
export async function POST(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const body = await request.json();

  // Single product tiers
  if (body.product_id && body.tiers) {
    const { product_id, tiers } = body as { product_id: number; tiers: { min_qty: number; unit_price: number }[] };

    db.prepare('DELETE FROM pricing_tiers WHERE product_id = ?').run(product_id);

    const stmt = db.prepare('INSERT INTO pricing_tiers (product_id, min_qty, unit_price) VALUES (?, ?, ?)');
    for (const tier of tiers) {
      if (tier.min_qty > 0 && tier.unit_price > 0) {
        stmt.run(product_id, tier.min_qty, tier.unit_price);
      }
    }

    return NextResponse.json({ success: true, message: `${tiers.length} faixas salvas` });
  }

  // Bulk apply: apply same tiers to multiple products
  if (body.product_ids && body.tiers) {
    const { product_ids, tiers } = body as { product_ids: number[]; tiers: { min_qty: number; unit_price: number }[] };

    const delStmt = db.prepare('DELETE FROM pricing_tiers WHERE product_id = ?');
    const insStmt = db.prepare('INSERT INTO pricing_tiers (product_id, min_qty, unit_price) VALUES (?, ?, ?)');

    let count = 0;
    for (const pid of product_ids) {
      delStmt.run(pid);
      for (const tier of tiers) {
        if (tier.min_qty > 0 && tier.unit_price > 0) {
          insStmt.run(pid, tier.min_qty, tier.unit_price);
        }
      }
      count++;
    }

    return NextResponse.json({ success: true, message: `Faixas aplicadas a ${count} produtos` });
  }

  // Bulk apply with margin percentage over cost price
  if (body.product_ids && body.margin_tiers) {
    const { product_ids, margin_tiers } = body as {
      product_ids: number[];
      margin_tiers: { min_qty: number; margin_percent: number }[];
    };

    const delStmt = db.prepare('DELETE FROM pricing_tiers WHERE product_id = ?');
    const insStmt = db.prepare('INSERT INTO pricing_tiers (product_id, min_qty, unit_price) VALUES (?, ?, ?)');
    const getProduct = db.prepare('SELECT price FROM products WHERE id = ?');

    let count = 0;
    for (const pid of product_ids) {
      const product = getProduct.get(pid) as { price: number | null } | undefined;
      if (!product?.price) continue;

      delStmt.run(pid);
      for (const tier of margin_tiers) {
        if (tier.min_qty > 0 && tier.margin_percent >= 0) {
          const sellPrice = Math.round(product.price * (1 + tier.margin_percent / 100) * 100) / 100;
          insStmt.run(pid, tier.min_qty, sellPrice);
        }
      }
      count++;
    }

    return NextResponse.json({ success: true, message: `Margem aplicada a ${count} produtos` });
  }

  return NextResponse.json({ error: 'Formato invalido' }, { status: 400 });
}

// DELETE: Remove all tiers for a product
export async function DELETE(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const productId = request.nextUrl.searchParams.get('product_id');

  if (productId) {
    db.prepare('DELETE FROM pricing_tiers WHERE product_id = ?').run(Number(productId));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'product_id obrigatorio' }, { status: 400 });
}
