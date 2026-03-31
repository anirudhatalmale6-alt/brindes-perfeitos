import { BaseImporter, ProductData } from './base-importer';
import https from 'https';

interface XbzProduct {
  IdProduto: number;
  CodigoXbz: string;
  CodigoComposto: string;
  CodigoAmigavel: string;
  Nome: string;
  Descricao: string;
  SiteLink: string;
  ImageLink: string;
  WebTipo: string;
  WebSubTipo: string;
  CorWebPrincipal: string;
  CorWebSecundaria: string;
  Peso: number;
  Altura: number;
  Largura: number;
  Profundidade: number;
  PrecoVenda: number;
  QuantidadeDisponivel: number;
  QuantidadeDisponivelEstoquePrincipal: number;
  Ncm: string;
}

const XBZ_API_URL = 'https://api.minhaxbz.com.br:5001/api/clientes/GetListaDeProdutos';
const XBZ_CNPJ = '14441490000176';
const XBZ_TOKEN = 'XF9D5AD1E2';

// Map XBZ color names to hex codes
const COLOR_HEX_MAP: Record<string, string> = {
  'AZUL': '#3B82F6',
  'AMARELO': '#EAB308',
  'BRANCO': '#FFFFFF',
  'PRETO': '#000000',
  'VERMELHO': '#EF4444',
  'VERDE': '#22C55E',
  'ROSA': '#EC4899',
  'ROXO': '#A855F7',
  'LARANJA': '#F97316',
  'CINZA': '#6B7280',
  'CHUMBO': '#4B5563',
  'MARROM': '#92400E',
  'DOURADO': '#D4A843',
  'PRATA': '#C0C0C0',
  'BEGE': '#D2B48C',
  'BRONZE': '#CD7F32',
  'INOX': '#D1D5DB',
  'KRAFT': '#C4A882',
  'BAMBU': '#D4A76A',
  'MADEIRA': '#8B6914',
  'COBRE': '#B87333',
  'TRANSPARENTE': '#E5E7EB',
  'COLORIDO': '#8B5CF6',
};

// Category mapping based on product names
function guessCategory(name: string): string {
  const n = name.toUpperCase();
  if (n.includes('CANETA') || n.includes('ESFEROGRAFICA') || n.includes('LAPISEIRA')) return 'Canetas';
  if (n.includes('CANECA') || n.includes('COPO') || n.includes('XICARA')) return 'Canecas e Copos';
  if (n.includes('GARRAFA') || n.includes('SQUEEZE') || n.includes('CANTIL') || n.includes('WHISKY')) return 'Garrafas e Squeezes';
  if (n.includes('MOCHILA') || n.includes('BOLSA') || n.includes('MALA') || n.includes('NECESSAIRE') || n.includes('POCHETE') || n.includes('SACOLA')) return 'Mochilas e Bolsas';
  if (n.includes('CAMISETA') || n.includes('CAMISA') || n.includes('BONE') || n.includes('CHAPEU') || n.includes('AVENTAL')) return 'Vestuario';
  if (n.includes('CADERNO') || n.includes('BLOCO') || n.includes('AGENDA') || n.includes('PASTA')) return 'Cadernos e Blocos';
  if (n.includes('CHAVE') || n.includes('CHAVEIRO')) return 'Chaveiros';
  if (n.includes('RELOGIO') || n.includes('SMARTWATCH')) return 'Relogios';
  if (n.includes('CAIXA DE SOM') || n.includes('FONE') || n.includes('SPEAKER') || n.includes('EARBUDS') || n.includes('HEADPHONE')) return 'Audio';
  if (n.includes('CARREGADOR') || n.includes('POWERBANK') || n.includes('POWER BANK') || n.includes('CABO USB') || n.includes('HUB USB')) return 'Tecnologia';
  if (n.includes('PEN DRIVE') || n.includes('PENDRIVE') || n.includes('CARTAO USB')) return 'Pen Drives';
  if (n.includes('GUARDA-CHUVA') || n.includes('SOMBRINHA')) return 'Guarda-Chuvas';
  if (n.includes('TOALHA') || n.includes('ROUPAO')) return 'Toalhas';
  if (n.includes('CHURRASCO') || n.includes('KIT VINHO') || n.includes('KIT QUEIJO') || n.includes('TABUA')) return 'Kit Churrasco e Vinho';
  if (n.includes('ESPELHO') || n.includes('LIXA') || n.includes('CORTADOR') || n.includes('KIT MANICURE') || n.includes('NECESSAIRE')) return 'Beleza e Cuidados';
  if (n.includes('LANTERNA') || n.includes('LUMINARIA') || n.includes('LED')) return 'Iluminacao';
  if (n.includes('MOUSEPAD') || n.includes('MOUSE PAD') || n.includes('SUPORTE CELULAR') || n.includes('SUPORTE NOTEBOOK')) return 'Acessorios de Escritorio';
  if (n.includes('GALAO') || n.includes('POTE') || n.includes('MARMITA') || n.includes('LANCHEIRA')) return 'Utilidades';
  return 'Brindes Diversos';
}

export class XbzBrindesImporter extends BaseImporter {
  constructor() {
    super('xbzbrindes');
  }

  async *fetchProducts(): AsyncGenerator<ProductData> {
    // Fetch all products from XBZ API using https module to handle SSL
    const url = `${XBZ_API_URL}?cnpj=${XBZ_CNPJ}&token=${XBZ_TOKEN}`;

    const allProducts: XbzProduct[] = await new Promise((resolve, reject) => {
      const req = https.get(url, {
        rejectUnauthorized: false, // XBZ API may use custom SSL cert
        headers: { 'Accept': 'application/json' },
        timeout: 60000,
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              reject(new Error(`XBZ API error: HTTP ${res.statusCode} - ${data.substring(0, 200)}`));
              return;
            }
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`XBZ API parse error: ${e}`));
          }
        });
      });
      req.on('error', (e) => reject(new Error(`XBZ API connection error: ${e.message}`)));
      req.on('timeout', () => { req.destroy(); reject(new Error('XBZ API timeout after 60s')); });
    });

    // Group products by CodigoAmigavel (same product, different colors)
    const grouped = new Map<string, XbzProduct[]>();
    for (const p of allProducts) {
      const key = p.CodigoAmigavel;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(p);
    }

    // Yield one product per group with all color variants
    const entries = Array.from(grouped.entries());
    for (const [code, variants] of entries) {
      const primary = variants[0];

      // Collect all colors from variants
      const colorSet = new Map<string, { name: string; hex?: string }>();
      let totalStock = 0;
      const images: string[] = [];

      for (const v of variants) {
        if (v.CorWebPrincipal && !colorSet.has(v.CorWebPrincipal)) {
          colorSet.set(v.CorWebPrincipal, {
            name: v.CorWebPrincipal,
            hex: COLOR_HEX_MAP[v.CorWebPrincipal.trim()] || undefined,
          });
        }
        if (v.QuantidadeDisponivel > 0) {
          totalStock += v.QuantidadeDisponivel;
        }
        if (v.ImageLink && !images.includes(v.ImageLink)) {
          images.push(v.ImageLink);
        }
      }

      const colors = Array.from(colorSet.values());

      // Build specs
      const specs: Record<string, string> = {};
      if (primary.Peso > 0) specs['Peso'] = `${primary.Peso}g`;
      if (primary.Altura > 0 && primary.Largura > 0) {
        const dims = [primary.Altura, primary.Largura];
        if (primary.Profundidade > 0) dims.push(primary.Profundidade);
        specs['Dimensoes'] = dims.map(d => `${d}cm`).join(' x ');
      }
      if (totalStock > 0) specs['Estoque'] = `${totalStock} unidades`;
      if (primary.Ncm) specs['NCM'] = primary.Ncm;

      const categoryName = guessCategory(primary.Nome);

      yield {
        supplier_sku: code,
        name: primary.Nome,
        description: primary.Descricao,
        category_name: categoryName,
        specs: Object.keys(specs).length > 0 ? specs : undefined,
        colors: colors.length > 0 ? colors : undefined,
        image_main: primary.ImageLink || undefined,
        images: images.length > 1 ? images : undefined,
        units_per_box: totalStock > 0 ? totalStock : undefined,
        source_url: primary.SiteLink || `https://www.xbzbrindes.com.br/${code}`,
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
