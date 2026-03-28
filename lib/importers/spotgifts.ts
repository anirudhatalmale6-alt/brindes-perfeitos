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

interface CategoryInfo {
  name: string;
  url: string;
  id: string;
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

  private async getCategories(): Promise<CategoryInfo[]> {
    const html = await this.fetchPage(`${BASE_URL}/pt/catalogo/`);
    const $ = cheerio.load(html);
    const categories: CategoryInfo[] = [];

    // Parse category filters from the catalog page
    $('a[href*="/pt/catalogo/"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const name = $(el).text().trim();
      if (href && name && !href.includes('?') && href !== '/pt/catalogo/' && name.length > 1) {
        const slug = href.replace('/pt/catalogo/', '').replace(/\/$/, '');
        if (slug && !slug.includes('/') && slug.length > 2) {
          categories.push({ name, url: `${BASE_URL}${href}`, id: slug });
        }
      }
    });

    // Deduplicate
    const seen = new Set<string>();
    return categories.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }

  private async getProductListPage(categoryUrl: string, page: number): Promise<{ skus: string[]; hasMore: boolean }> {
    const url = page > 1 ? `${categoryUrl}?page=${page}` : categoryUrl;
    const html = await this.fetchPage(url);
    const $ = cheerio.load(html);
    const skus: string[] = [];

    // Extract product links - pattern: /pt/catalogo/{category}/{sku}/
    $('a[href*="/pt/catalogo/"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const match = href.match(/\/pt\/catalogo\/[^/]+\/(\d+)\//);
      if (match) {
        skus.push(match[1]);
      }
    });

    // Deduplicate
    const unique = Array.from(new Set(skus));

    // Check if there's a next page link
    const hasMore = $('a[href*="page="]').filter((_, el) => {
      const href = $(el).attr('href') || '';
      return href.includes(`page=${page + 1}`);
    }).length > 0;

    return { skus: unique, hasMore };
  }

  private async getProductDetail(sku: string, categorySlug: string): Promise<ProductData | null> {
    try {
      const url = `${BASE_URL}/pt/catalogo/${categorySlug}/${sku}/`;
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);

      const name = $('h1').first().text().trim() || $('title').text().split('|')[0].trim();
      if (!name) return null;

      // Extract description
      const description = $('.product-description, .description, [class*="descri"]').first().text().trim() ||
        $('meta[name="description"]').attr('content') || '';

      // Extract specs from table or list
      const specs: Record<string, string> = {};
      $('table tr, .specs li, .product-info li, .product-details li').each((_, el) => {
        const cells = $(el).find('td, th');
        if (cells.length >= 2) {
          const key = $(cells[0]).text().trim();
          const val = $(cells[1]).text().trim();
          if (key && val) specs[key] = val;
        }
        // Also try colon-separated text
        const text = $(el).text().trim();
        const colonMatch = text.match(/^([^:]+):\s*(.+)$/);
        if (colonMatch) specs[colonMatch[1].trim()] = colonMatch[2].trim();
      });

      // Extract images
      const images: string[] = [];
      $('img[src*="/fotos/"], img[src*="produto"], img[data-src*="/fotos/"]').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src') || '';
        if (src && !src.includes('thumb') && !src.includes('icon')) {
          const fullUrl = src.startsWith('http') ? src : `${BASE_URL}${src}`;
          images.push(fullUrl);
        }
      });

      // Also check for gallery images
      $('a[href*="/fotos/"], a[data-fancybox] img').each((_, el) => {
        const src = $(el).attr('href') || $(el).find('img').attr('src') || '';
        if (src && src.includes('/fotos/')) {
          const fullUrl = src.startsWith('http') ? src : `${BASE_URL}${src}`;
          if (!images.includes(fullUrl)) images.push(fullUrl);
        }
      });

      // Extract colors
      const colors: { name: string; code?: string }[] = [];
      $('.color, .cor, [class*="color"] span, [class*="cor"] span').each((_, el) => {
        const colorName = $(el).text().trim() || $(el).attr('title') || '';
        if (colorName) colors.push({ name: colorName });
      });

      // Try to download main image
      let imageMain = images[0] || '';
      if (imageMain) {
        const ext = imageMain.match(/\.\w+$/)?.[0] || '.jpg';
        imageMain = await this.downloadImage(imageMain, `${sku}_main${ext}`);
      }

      return {
        supplier_sku: sku,
        name,
        description,
        category_name: categorySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        specs: Object.keys(specs).length > 0 ? specs : undefined,
        colors: colors.length > 0 ? colors : undefined,
        image_main: imageMain,
        images: images.length > 1 ? images.slice(1) : undefined,
        source_url: url,
      };
    } catch (err) {
      this.stats.error_log.push(`Error fetching SKU ${sku}: ${err}`);
      return null;
    }
  }

  async *fetchProducts(): AsyncGenerator<ProductData> {
    const categories = await this.getCategories();

    if (categories.length === 0) {
      // Fallback: try fetching from the main catalog page directly
      const allSkus = new Set<string>();
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 50) {
        const url = `${BASE_URL}/pt/catalogo/?page=${page}`;
        try {
          const html = await this.fetchPage(url);
          const $ = cheerio.load(html);
          let found = 0;

          $('a[href*="/pt/catalogo/"]').each((_, el) => {
            const href = $(el).attr('href') || '';
            const match = href.match(/\/pt\/catalogo\/([^/]+)\/(\d+)\//);
            if (match && !allSkus.has(match[2])) {
              allSkus.add(match[2]);
              found++;
            }
          });

          hasMore = found > 0;
          page++;
          await delay(1500);
        } catch {
          hasMore = false;
        }
      }

      // Fetch details for each SKU
      for (const sku of Array.from(allSkus)) {
        const product = await this.getProductDetail(sku, 'catalogo');
        if (product) yield product;
        await delay(1000);
      }
      return;
    }

    // Process each category
    const allProcessed = new Set<string>();

    for (const category of categories) {
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 30) {
        try {
          const { skus, hasMore: more } = await this.getProductListPage(category.url, page);

          for (const sku of skus) {
            if (allProcessed.has(sku)) continue;
            allProcessed.add(sku);

            const product = await this.getProductDetail(sku, category.id);
            if (product) {
              product.category_name = category.name;
              yield product;
            }
            await delay(1000 + Math.random() * 500);
          }

          hasMore = more && skus.length > 0;
          page++;
          await delay(1500);
        } catch {
          hasMore = false;
        }
      }
    }
  }
}
