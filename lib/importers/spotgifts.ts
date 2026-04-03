import { BaseImporter, ProductData } from './base-importer';

const API_BASE = 'https://ws.spotgifts.com.br/api/v1SSL';
const IMAGE_BASE = 'https://www.spotgifts.com.br/fotos/produtos';
const ACCESS_KEY = 'PEYHGDlNHjHEwXQG';

interface SpotProduct {
  ProdReference: string;
  Name: string;
  Description: string;
  ShortDescription: string;
  Type: string;
  TypeCode: string;
  SubType: string;
  SubTypeCode: string;
  MainImage: string;
  AllImageList: string | null;
  Brand: string;
  Materials: string;
  CombinedSizes: string;
  Colors: string;
  IsStockOut: boolean;
  OnlineExclusive: boolean;
  Catalogs: string;
  BoxQuantity: number;
  BoxInnerQuantity: number;
  BoxWeightKG: number;
  BoxSizeM: string;
  WeightGr: string;
  KeyWords: string;
  CustomizationTypes: string;
  CustomizationDefault: string;
  ProductComponentDefaultLocationAreaMM: string;
  Certificates: string;
  CountryOfOrigin: string;
  UpdateDate: string;
}

interface SpotOptional {
  Sku: string;
  ProdReference: string;
  ColorDesc1: string;
  ColorHex1: string;
  ColorCode: string;
  OptionalImage1: string;
  OptionalImage2: string;
  YourPrice: number;
  MinQt1: number | null;
  Price1: number | null;
  MinQt2: number | null;
  Price2: number | null;
  MinQt3: number | null;
  Price3: number | null;
  Size: string;
  Capacity: string;
}

interface SpotStock {
  Sku: string;
  Quantity: number;
}

interface SpotColor {
  ColorCode: string;
  Description: string;
}

// Map Spot types to our category names
const TYPE_CATEGORY_MAP: Record<string, string> = {
  'Escrita': 'Instrumentos de Escrita',
  'Escritório': 'Escritorio',
  'Tecnologia': 'Tecnologia',
  'Mochilas, Pastas & Sacolas': 'Bolsas',
  'Mochilas, Malas & Pastas': 'Bolsas',
  'Sacolas & Bolsas Térmicas': 'Bolsas',
  'Squeezes & Copos': 'Garrafas e Squeezes',
  'Sol & Chuva': 'Guarda-chuvas',
  'Criança & Escolar': 'Infantil',
  'Esporte & Ar Livre': 'Esporte',
  'Casa, Restaurante & Bar': 'Casa',
  'Pessoal & Viagem': 'Viagem',
  'Chaveiros & Porta-Cartões': 'Chaveiros',
  'Exclusivo': 'Brindes Exclusivos',
  'Exclusivos': 'Brindes Exclusivos',
  'Agendas': 'Escritorio',
  'SUCO': 'Textil',
  'Stockout': 'Promocao',
  'Máscaras': 'Saude',
  'Últimas Chegadas': 'Novidades',
};

export class SpotGiftsImporter extends BaseImporter {
  private token: string = '';
  private colorMap: Map<string, string> = new Map();

  constructor() {
    super('spotgifts');
  }

  private async apiCall<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const allParams: Record<string, string> = { ...params };
    if (this.token) allParams.token = this.token;
    allParams.lang = 'PT';
    const query = new URLSearchParams(allParams);
    const url = `${API_BASE}/${endpoint}?${query}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Spot API ${endpoint}: HTTP ${res.status}`);
      return res.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  private async authenticate(): Promise<void> {
    const data = await this.apiCall<{ Token: string; ErrorCode: string | null; ErrorMessage: string | null }>('authenticateClient', { accessKey: ACCESS_KEY });
    if (data.ErrorCode) throw new Error(`Spot auth error: ${data.ErrorMessage}`);
    this.token = data.Token;
  }

  private async loadColors(): Promise<void> {
    const data = await this.apiCall<{ Colors: SpotColor[] }>('colors');
    for (const c of data.Colors) {
      this.colorMap.set(c.ColorCode, c.Description);
    }
  }

  private imageUrl(filename: string): string {
    if (!filename) return '';
    if (filename.startsWith('http')) return filename;
    return `${IMAGE_BASE}/${filename}`;
  }

  private mapCategory(type: string): string {
    return TYPE_CATEGORY_MAP[type] || type.replace(/[&]/g, 'e').replace(/\s+/g, ' ').trim() || 'Brindes Diversos';
  }

  async *fetchProducts(): AsyncGenerator<ProductData> {
    // Authenticate
    await this.authenticate();

    // Load color reference
    await this.loadColors();

    // Fetch data sequentially (parallel calls cause 502 on Spot's server)
    const productsData = await this.apiCall<{ Products: SpotProduct[]; Count: number }>('products');
    const optionalsData = await this.apiCall<{ Optionals: SpotOptional[]; Count: number }>('optionals');
    const stocksData = await this.apiCall<{ Stocks: SpotStock[]; Count: number }>('stocks');

    // Index optionals by ProdReference
    const optionalsByRef = new Map<string, SpotOptional[]>();
    for (const opt of optionalsData.Optionals) {
      if (!optionalsByRef.has(opt.ProdReference)) optionalsByRef.set(opt.ProdReference, []);
      optionalsByRef.get(opt.ProdReference)!.push(opt);
    }

    // Index stock by SKU
    const stockBySku = new Map<string, number>();
    for (const s of stocksData.Stocks) {
      stockBySku.set(s.Sku, s.Quantity);
    }

    // Process each product
    for (const prod of productsData.Products) {
      try {
        const optionals = optionalsByRef.get(prod.ProdReference) || [];

        // Build colors with per-color stock
        const colors: { name: string; code?: string; hex?: string }[] = [];
        const colorStock: Record<string, number> = {};

        for (const opt of optionals) {
          const colorName = opt.ColorDesc1 || this.colorMap.get(opt.ColorCode) || '';
          if (colorName && !colors.find(c => c.name === colorName)) {
            colors.push({
              name: colorName,
              code: opt.ColorCode,
              hex: opt.ColorHex1 || undefined,
            });
          }
          // Stock per color
          const qty = stockBySku.get(opt.Sku) || 0;
          if (colorName) {
            colorStock[colorName] = (colorStock[colorName] || 0) + qty;
          }
        }

        // Images
        const allImages: string[] = [];
        if (prod.AllImageList) {
          for (const img of prod.AllImageList.split(',')) {
            const trimmed = img.trim();
            if (trimmed) allImages.push(this.imageUrl(trimmed));
          }
        }
        // Also add optional images
        for (const opt of optionals) {
          if (opt.OptionalImage1) {
            const url = this.imageUrl(opt.OptionalImage1);
            if (!allImages.includes(url)) allImages.push(url);
          }
        }

        const mainImage = prod.MainImage ? this.imageUrl(prod.MainImage) : (allImages[0] || '');
        const additionalImages = allImages.filter(i => i !== mainImage).slice(0, 10);

        // Specs
        const specs: Record<string, string> = {};
        if (prod.CombinedSizes) specs['Dimensoes'] = prod.CombinedSizes;
        if (prod.Materials) specs['Material'] = prod.Materials;
        if (prod.WeightGr) specs['Peso'] = `${prod.WeightGr}g`;
        if (prod.BoxQuantity) specs['Unidades por Caixa'] = String(prod.BoxQuantity);
        if (prod.BoxInnerQuantity) specs['Caixa Interna'] = String(prod.BoxInnerQuantity);
        if (prod.BoxWeightKG) specs['Peso da Caixa'] = `${prod.BoxWeightKG}kg`;
        if (prod.Certificates) specs['Certificados'] = prod.Certificates;
        if (prod.CountryOfOrigin) specs['Origem'] = prod.CountryOfOrigin;
        if (prod.Brand) specs['Marca'] = prod.Brand;

        // Personalization techniques
        const techniques: string[] = [];
        if (prod.CustomizationTypes) {
          for (const t of prod.CustomizationTypes.split(',')) {
            const trimmed = t.trim();
            if (trimmed && !techniques.includes(trimmed)) techniques.push(trimmed);
          }
        }

        // Price from first optional (cost price = YourPrice)
        const firstOpt = optionals[0];
        const price = firstOpt?.YourPrice || undefined;

        // Category
        const categoryName = this.mapCategory(prod.Type);

        yield {
          supplier_sku: prod.ProdReference,
          name: prod.Name,
          short_description: prod.ShortDescription || undefined,
          description: prod.Description || undefined,
          category_name: categoryName,
          specs: Object.keys(specs).length > 0 ? specs : undefined,
          colors: colors.length > 0 ? colors : undefined,
          color_stock: Object.keys(colorStock).length > 0 ? colorStock : undefined,
          image_main: mainImage || undefined,
          images: additionalImages.length > 0 ? additionalImages : undefined,
          min_order: prod.BoxInnerQuantity || undefined,
          units_per_box: prod.BoxQuantity || undefined,
          box_weight: prod.BoxWeightKG || undefined,
          box_dimensions: prod.BoxSizeM || undefined,
          personalization_techniques: techniques.length > 0 ? techniques : undefined,
          source_url: `https://www.spotgifts.com.br/pt/catalogo/${prod.ProdReference}/`,
          price: price,
        };
      } catch (err) {
        this.stats.error_log.push(`Error processing Spot product ${prod.ProdReference}: ${err}`);
        this.stats.errors++;
      }
    }
  }
}
