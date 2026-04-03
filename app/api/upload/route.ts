import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Support both single file (banners) and multiple files (products)
    const singleFile = formData.get('file') as File | null;
    const multiFiles = formData.getAll('images') as File[];
    const folder = formData.get('folder') as string;
    const productId = formData.get('product_id') as string;

    const files = singleFile ? [singleFile] : multiFiles;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Determine upload directory
    let subDir: string;
    if (folder) {
      subDir = folder; // e.g. "banners"
    } else {
      subDir = `products/${productId || 'misc'}`;
    }

    const uploadDir = path.join(process.cwd(), 'public', 'images', subDir);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const urls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || '.jpg';
      const baseName = file.name.replace(ext, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const timestamp = Date.now();
      const fileName = `${baseName}_${timestamp}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);
      urls.push(`/images/${subDir}/${fileName}`);
    }

    // Return single URL for single file, array for multiple
    if (singleFile) {
      return NextResponse.json({ success: true, url: urls[0] });
    }
    return NextResponse.json({ success: true, urls });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
