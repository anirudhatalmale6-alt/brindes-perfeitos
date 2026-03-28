import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  initializeDatabase();
  const db = getDb();
  const runs = db.prepare('SELECT * FROM import_runs ORDER BY started_at DESC LIMIT 20').all();
  return NextResponse.json(runs);
}
