import { NextResponse } from 'next/server';
import https from 'https';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = 'https://api.minhaxbz.com.br:5001/api/clientes/GetListaDeProdutos?cnpj=14441490000176&token=XF9D5AD1E2';

  try {
    const result: { status: number; type: string; length: number; preview: string } = await new Promise((resolve, reject) => {
      const req = https.get(url, {
        rejectUnauthorized: false,
        headers: { 'Accept': 'application/json' },
        timeout: 30000,
      }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const data = Buffer.concat(chunks).toString('utf-8');
          let type = 'unknown';
          try {
            const parsed = JSON.parse(data);
            type = Array.isArray(parsed) ? `array[${parsed.length}]` : typeof parsed;
          } catch { type = 'not-json'; }
          resolve({ status: res.statusCode || 0, type, length: data.length, preview: data.substring(0, 500) });
        });
      });
      req.on('error', (e) => reject(e));
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) });
  }
}
