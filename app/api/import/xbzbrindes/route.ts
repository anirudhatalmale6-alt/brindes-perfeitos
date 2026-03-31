import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Global state for background import
let importRunning = false;
let importProgress = { total: 0, processed: 0, added: 0, updated: 0, errors: 0, status: 'idle' as string };

export async function POST(request: NextRequest) {
  initializeDatabase();

  const contentType = request.headers.get('content-type') || '';

  // CSV upload no longer needed - using API
  if (contentType.includes('multipart/form-data')) {
    return NextResponse.json({ success: false, error: 'Use o botao "Importar XBZ Brindes" para importar via API' });
  }

  // API import (background)
  if (importRunning) {
    return NextResponse.json({ success: false, error: 'Importacao XBZ ja em andamento', progress: importProgress });
  }

  importRunning = true;
  importProgress = { total: 0, processed: 0, added: 0, updated: 0, errors: 0, status: 'running' };

  runXbzImport().catch(err => {
    importProgress.status = `error: ${err}`;
    importRunning = false;
  });

  return NextResponse.json({ success: true, message: 'Importacao XBZ iniciada', progress: importProgress });
}

export async function GET() {
  return NextResponse.json({ running: importRunning, progress: importProgress });
}

async function runXbzImport() {
  try {
    const { XbzBrindesImporter } = await import('@/lib/importers/xbzbrindes');
    const importer = new XbzBrindesImporter();

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
