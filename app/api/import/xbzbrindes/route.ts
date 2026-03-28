import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  initializeDatabase();
  try {
    const { XbzBrindesImporter, parseCSV } = await import('@/lib/importers/xbzbrindes');
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file || typeof file === 'string') {
        return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado' }, { status: 400 });
      }

      const text = await file.text();
      const csvData = parseCSV(text);

      if (csvData.length < 2) {
        return NextResponse.json({ success: false, error: 'Arquivo CSV vazio ou invalido' }, { status: 400 });
      }

      const importer = new XbzBrindesImporter();
      importer.setCsvData(csvData);
      const stats = await importer.run();

      return NextResponse.json({ success: true, ...stats });
    } else {
      const importer = new XbzBrindesImporter();
      const stats = await importer.run();
      return NextResponse.json({ success: true, ...stats });
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
