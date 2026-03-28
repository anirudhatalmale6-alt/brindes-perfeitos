import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';
import { getDb } from '@/lib/db';

export async function GET() {
  initializeDatabase();
  const db = getDb();
  const rows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  initializeDatabase();
  const db = getDb();
  const body = await request.json();
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(body)) {
    stmt.run(key, value as string);
  }
  return NextResponse.json({ success: true });
}
