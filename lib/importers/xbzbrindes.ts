import { BaseImporter, ProductData } from './base-importer';

// XBZ Brindes is behind Cloudflare, so we primarily support CSV import
// and provide a Playwright-based scraper as secondary option

export class XbzBrindesImporter extends BaseImporter {
  private csvData: string[][] = [];

  constructor() {
    super('xbzbrindes');
  }

  setCsvData(data: string[][]) {
    this.csvData = data;
  }

  async *fetchProducts(): AsyncGenerator<ProductData> {
    if (this.csvData.length === 0) {
      this.stats.error_log.push('XBZ Brindes requires CSV import (site is behind Cloudflare)');
      return;
    }

    // Parse CSV - expected columns:
    // sku, nome, descricao, categoria, imagem_url, material, dimensoes, peso, cores, pedido_minimo
    const headers = this.csvData[0].map(h => h.toLowerCase().trim());
    const skuIdx = headers.indexOf('sku');
    const nameIdx = headers.indexOf('nome');
    const descIdx = headers.indexOf('descricao');
    const catIdx = headers.indexOf('categoria');
    const imgIdx = headers.indexOf('imagem_url');
    const matIdx = headers.indexOf('material');
    const dimIdx = headers.indexOf('dimensoes');
    const weightIdx = headers.indexOf('peso');
    const colorsIdx = headers.indexOf('cores');
    const minIdx = headers.indexOf('pedido_minimo');

    for (let i = 1; i < this.csvData.length; i++) {
      const row = this.csvData[i];
      if (!row || row.length < 2) continue;

      const sku = skuIdx >= 0 ? row[skuIdx]?.trim() : String(i);
      const name = nameIdx >= 0 ? row[nameIdx]?.trim() : '';

      if (!name) continue;

      const specs: Record<string, string> = {};
      if (matIdx >= 0 && row[matIdx]) specs['Material'] = row[matIdx].trim();
      if (dimIdx >= 0 && row[dimIdx]) specs['Dimensoes'] = row[dimIdx].trim();
      if (weightIdx >= 0 && row[weightIdx]) specs['Peso'] = row[weightIdx].trim();

      const colors = colorsIdx >= 0 && row[colorsIdx]
        ? row[colorsIdx].split(/[,;]/).map(c => ({ name: c.trim() })).filter(c => c.name)
        : undefined;

      const imageMain = imgIdx >= 0 ? row[imgIdx]?.trim() : '';

      // Download image if URL provided
      let localImage = imageMain;
      if (imageMain && imageMain.startsWith('http')) {
        const ext = imageMain.match(/\.\w+$/)?.[0] || '.jpg';
        localImage = await this.downloadImage(imageMain, `${sku}_main${ext}`);
      }

      yield {
        supplier_sku: sku,
        name,
        description: descIdx >= 0 ? row[descIdx]?.trim() : undefined,
        category_name: catIdx >= 0 ? row[catIdx]?.trim() : undefined,
        specs: Object.keys(specs).length > 0 ? specs : undefined,
        colors,
        image_main: localImage || undefined,
        min_order: minIdx >= 0 && row[minIdx] ? parseInt(row[minIdx]) : undefined,
        source_url: `https://www.xbzbrindes.com.br/produto/${sku}`,
      };
    }
  }
}

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        current.push(field);
        field = '';
      } else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        current.push(field);
        field = '';
        if (current.some(c => c.trim())) rows.push(current);
        current = [];
        if (ch === '\r') i++;
      } else {
        field += ch;
      }
    }
  }
  if (field || current.length > 0) {
    current.push(field);
    if (current.some(c => c.trim())) rows.push(current);
  }

  return rows;
}
