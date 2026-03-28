import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export async function POST() {
  initializeDatabase();
  try {
    const { SpotGiftsImporter } = await import('@/lib/importers/spotgifts');
    const importer = new SpotGiftsImporter();
    const stats = await importer.run();
    return NextResponse.json({
      success: true,
      ...stats,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
