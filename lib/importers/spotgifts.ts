import * as cheerio from 'cheerio';
import { BaseImporter, ProductData } from './base-importer';

const BASE_URL = 'https://www.spotgifts.com.br';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
};

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class SpotGiftsImporter extends BaseImporter {
  constructor() {
    super('spotgifts');
  }

  private async fetchPage(url: string): Promise<string> {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.text();
  }

  private async getProductUrlsFromSitemap(): Promise<{ url: string; sku: string; category: string }[]> {
    const xml = await this.fetchPage(`${BASE_URL}/sitemap.xml`);
    const $ = cheerio.load(xml, { xmlMode: true });
    const products: { url: string; sku: string; category: string }[] = [];

    $('url loc').each((_, el) => {
      const loc = $(el).text().trim();
      const match = loc.match(/\/pt\/catalogo\/([^/]+)\/(\d+)\//);
      if (match) {
        products.push({
          url: loc,
          category: match[1],
          sku: match[2],
        });
      }
    });

    return products;
  }

  private categorySlugToName(slug: string): string {
    const map: Record<string, string> = {
      'esferograficas': 'Canetas Esferograficas',
      'esferograficas-em-metal-e-outros': 'Canetas Metal',
      'esferograficas-em-plastico': 'Canetas Plastico',
      'conjuntos-de-escrita': 'Conjuntos de Escrita',
      'conjuntos-com-2-postos': 'Conjuntos de Escrita',
      'lapiseiras-e-lapis': 'Lapis e Lapiseiras',
      'marcadores-e-fluorescentes': 'Marcadores',
      'mochilas-para-pc-tablet': 'Mochilas',
      'mochilas': 'Mochilas',
      'pastas-para-pc-tablet': 'Pastas',
      'pastas': 'Pastas',
      'malas-de-viagem': 'Malas de Viagem',
      'bolsas-de-desporto-e-viagem': 'Bolsas de Viagem',
      'bolsas-termicas': 'Bolsas Termicas',
      'sacolas': 'Sacolas',
      'sacolas-em-non-woven': 'Sacolas',
      'sacolas-em-algodao': 'Sacolas Algodao',
      'sacolas-em-juta': 'Sacolas Juta',
      'sacolas-em-papel': 'Sacolas Papel',
      'guarda-chuvas': 'Guarda-Chuvas',
      'guarda-sois': 'Guarda-Sois',
      'squeezes': 'Squeezes',
      'garrafas': 'Garrafas',
      'copos-e-canecas': 'Copos e Canecas',
      'jarras-e-infusores': 'Jarras e Infusores',
      'sets-de-bar': 'Sets de Bar',
      'conjuntos-de-churrasco': 'Churrasco',
      'aventais': 'Aventais',
      'chaveiros': 'Chaveiros',
      'porta-cartoes': 'Porta Cartoes',
      'cadernos': 'Cadernos',
      'blocos-de-notas': 'Blocos de Notas',
      'agendas-e-blocos': 'Agendas e Blocos',
      'headphones-e-auscultadores': 'Fones de Ouvido',
      'colunas-wireless': 'Caixas de Som',
      'powerbanks': 'Power Banks',
      'carregadores-wireless': 'Carregadores',
      'hubs-usb': 'Hubs USB',
      'pen-drives': 'Pen Drives',
      'cartoes-usb': 'Pen Drives',
      'bones-e-chapeus': 'Bones e Chapeus',
      'toalhas': 'Toalhas',
      'necessaires': 'Necessaires',
      'carteiras': 'Carteiras',
      'porta-passaportes': 'Porta Passaportes',
      'almofadas-e-mantas': 'Almofadas e Mantas',
      'anti-stress': 'Anti-Stress',
      'puzzles-e-jogos': 'Jogos',
      'ferramentas': 'Ferramentas',
      'lanternas': 'Lanternas',
      'kits-de-emergencia': 'Kits de Emergencia',
      'porta-crachas-e-acessorios': 'Porta Crachas',
      'oculos-de-sol': 'Oculos de Sol',
    };
    if (map[slug]) return map[slug];
    return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private async getProductDetail(url: string, sku: string, categorySlug: string): Promise<ProductData | null> {
    try {
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);

      // Product name from h1 or title
      const name = $('h1').first().text().trim() || $('title').text().split('|')[0].trim();
      if (!name) return null;

      // Description - try multiple selectors
      let description = '';
      $('p, .description, [class*="descri"]').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 30 && text.length < 2000 && !description) {
          description = text;
        }
      });
      if (!description) {
        description = $('meta[name="description"]').attr('content') || '';
      }

      // Extract specs from all text content
      const specs: Record<string, string> = {};
      const pageText = $('body').text();

      // Dimensions
      const dimMatch = pageText.match(/(?:Dimensões?|Medidas?)[:\s]*([^\n]+)/i);
      if (dimMatch) specs['Dimensoes'] = dimMatch[1].trim();

      // Material
      const matMatch = pageText.match(/(?:Material|Composição)[:\s]*([^\n]+)/i);
      if (matMatch) specs['Material'] = matMatch[1].trim();

      // Weight
      const weightMatch = pageText.match(/(?:Peso)[:\s]*([^\n]+)/i);
      if (weightMatch) specs['Peso'] = weightMatch[1].trim();

      // Box units
      const boxMatch = pageText.match(/(?:Embalagem exterior|Caixa exterior)[:\s]*(\d+)/i);
      if (boxMatch) specs['Unidades por Caixa'] = boxMatch[1];

      // Inner box
      const innerMatch = pageText.match(/(?:Embalagem interior|Caixa interior)[:\s]*(\d+)/i);
      if (innerMatch) specs['Unidades por Caixa Interna'] = innerMatch[1];

      // Extract ALL image URLs
      const images: string[] = [];
      $('img').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src') || '';
        if (src && src.includes('/fotos/produtos/')) {
          const fullUrl = src.startsWith('http') ? src : `${BASE_URL}${src}`;
          if (!images.includes(fullUrl)) images.push(fullUrl);
        }
      });

      // Also check link hrefs for high-res images
      $('a[href*="/fotos/"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        if (href.includes('/fotos/produtos/')) {
          const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
          if (!images.includes(fullUrl)) images.push(fullUrl);
        }
      });

      // If no images found, construct default URL pattern
      if (images.length === 0) {
        images.push(`${BASE_URL}/fotos/produtos/${sku}_set_2.jpg`);
      }

      // Main image: prefer _set_2 (catalog image) or _set_1
      const mainImage = images.find(i => i.includes('_set_2')) ||
                      images.find(i => i.includes('_set_1')) ||
                      images[0] || '';

      // Use external URLs directly (don't download)
      // Limit to max 10 images: prioritize _set_ images (product views) over color variants
      const setImages = images.filter(i => i.includes('_set_'));
      const otherImages = images.filter(i => !i.includes('_set_'));
      const limitedImages = [...setImages, ...otherImages].slice(0, 10);

      const imageMain = mainImage;
      const additionalImages = limitedImages.filter(i => i !== mainImage);

      // Extract colors
      const colors: { name: string; code?: string }[] = [];
      $('[class*="color"], [class*="cor"]').each((_, el) => {
        const colorName = $(el).text().trim() || $(el).attr('title') || '';
        if (colorName && colorName.length < 50) colors.push({ name: colorName });
      });
      // Also try from image alt/title attributes
      $('img[alt*="cor"], img[title]').each((_, el) => {
        const title = $(el).attr('title') || $(el).attr('alt') || '';
        if (title && title.length < 50 && !colors.find(c => c.name === title)) {
          colors.push({ name: title });
        }
      });

      // Min order from box info
      let minOrder: number | undefined;
      const minMatch = pageText.match(/(?:Quantidade\s*m[ií]nima|Pedido\s*m[ií]nimo|M[ií]nimo)[:\s]*(\d+)/i);
      if (minMatch) minOrder = parseInt(minMatch[1]);

      const categoryName = this.categorySlugToName(categorySlug);

      return {
        supplier_sku: sku,
        name,
        description: description || undefined,
        category_name: categoryName,
        specs: Object.keys(specs).length > 0 ? specs : undefined,
        colors: colors.length > 0 ? colors : undefined,
        image_main: imageMain,
        images: additionalImages.length > 0 ? additionalImages : undefined,
        min_order: minOrder,
        source_url: url,
      };
    } catch (err) {
      this.stats.error_log.push(`Error fetching SKU ${sku}: ${err}`);
      return null;
    }
  }

  async *fetchProducts(): AsyncGenerator<ProductData> {
    // Get all product URLs from sitemap
    const productUrls = await this.getProductUrlsFromSitemap();

    if (productUrls.length === 0) {
      this.stats.error_log.push('No products found in sitemap');
      return;
    }

    // Process each product
    for (const { url, sku, category } of productUrls) {
      const product = await this.getProductDetail(url, sku, category);
      if (product) {
        yield product;
      }
      // Respectful delay between requests
      await delay(800 + Math.random() * 400);
    }
  }
}
