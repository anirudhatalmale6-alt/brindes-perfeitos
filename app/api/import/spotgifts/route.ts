import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

// Global state for background import
let importRunning = false;
let importProgress = { total: 0, processed: 0, added: 0, updated: 0, errors: 0, status: 'idle' as string };

export async function POST() {
  initializeDatabase();

  if (importRunning) {
    return NextResponse.json({ success: false, error: 'Import already running', progress: importProgress });
  }

  importRunning = true;
  importProgress = { total: 0, processed: 0, added: 0, updated: 0, errors: 0, status: 'running' };

  // Run import in background (don't await)
  runImport().catch(err => {
    importProgress.status = `error: ${err}`;
    importRunning = false;
  });

  return NextResponse.json({ success: true, message: 'Import started', progress: importProgress });
}

export async function GET() {
  return NextResponse.json({ running: importRunning, progress: importProgress });
}

async function runImport() {
  try {
    const { SpotGiftsImporter } = await import('@/lib/importers/spotgifts');
    const importer = new SpotGiftsImporter();

    // Start the run tracking
    const stats = await importer.run((progress) => {
      importProgress.total = progress.total_found;
      importProgress.processed = progress.new_added + progress.updated + progress.errors;
      importProgress.added = progress.new_added;
      importProgress.updated = progress.updated;
      importProgress.errors = progress.errors;
    });

    importProgress = {
      total: stats.total_found,
      processed: stats.new_added + stats.updated + stats.errors,
      added: stats.new_added,
      updated: stats.updated,
      errors: stats.errors,
      status: 'completed',
    };
  } catch (err) {
    importProgress.status = `error: ${String(err)}`;
  } finally {
    importRunning = false;
  }
}
