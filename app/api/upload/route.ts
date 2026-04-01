import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const productId = formData.get('product_id') as string;
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'images', 'products', productId || 'misc');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const urls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const ext = path.extname(file.name) || '.jpg';
      const baseName = file.name.replace(ext, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const timestamp = Date.now();
      const fileName = `${baseName}_${timestamp}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);
      urls.push(`/images/products/${productId || 'misc'}/${fileName}`);
    }

    return NextResponse.json({ success: true, urls });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
