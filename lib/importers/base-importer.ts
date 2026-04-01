import { getDb } from '../db';
import { slugify } from '../utils';
import fs from 'fs';
import path from 'path';

export interface ProductData {
  supplier_sku: string;
  name: string;
  short_description?: string;
  description?: string;
  category_name?: string;
  specs?: Record<string, string>;
  colors?: { name: string; code?: string; hex?: string }[];
  image_main?: string;
  images?: string[];
  min_order?: number;
  units_per_box?: number;
  box_weight?: number;
  box_dimensions?: string;
  personalization_techniques?: string[];
  source_url?: string;
  price?: number;
}

export interface ImportStats {
  total_found: number;
  new_added: number;
  updated: number;
  errors: number;
  error_log: string[];
}

export abstract class BaseImporter {
  protected supplier: string;
  protected runId: number = 0;
  protected stats: ImportStats = { total_found: 0, new_added: 0, updated: 0, errors: 0, error_log: [] };

  constructor(supplier: string) {
    this.supplier = supplier;
  }

  abstract fetchProducts(): AsyncGenerator<ProductData>;

  protected startRun(): number {
    const db = getDb();
    const result = db.prepare(
      "INSERT INTO import_runs (supplier, status) VALUES (?, 'running')"
    ).run(this.supplier);
    this.runId = result.lastInsertRowid as number;
    return this.runId;
  }

  protected finishRun() {
    const db = getDb();
    db.prepare(`
      UPDATE import_runs SET status = 'completed', total_found = ?, new_added = ?, updated = ?,
      errors = ?, error_log = ?, finished_at = datetime('now') WHERE id = ?
    `).run(this.stats.total_found, this.stats.new_added, this.stats.updated,
      this.stats.errors, JSON.stringify(this.stats.error_log), this.runId);
  }

  protected failRun(error: string) {
    const db = getDb();
    db.prepare(`
      UPDATE import_runs SET status = 'failed', error_log = ?, finished_at = datetime('now') WHERE id = ?
    `).run(JSON.stringify([error]), this.runId);
  }

  protected findOrCreateCategory(categoryName: string): number | null {
    if (!categoryName) return null;
    const db = getDb();
    const slug = slugify(categoryName);
    const existing = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug) as { id: number } | undefined;
    if (existing) return existing.id;

    const result = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run(categoryName, slug);
    return result.lastInsertRowid as number;
  }

  protected upsertProduct(data: ProductData): 'new' | 'updated' | 'error' {
    const db = getDb();
    try {
      const existing = db.prepare(
        'SELECT id FROM products WHERE supplier = ? AND supplier_sku = ?'
      ).get(this.supplier, data.supplier_sku) as { id: number } | undefined;

      const categoryId = data.category_name ? this.findOrCreateCategory(data.category_name) : null;
      const slug = slugify(data.name);

      // Use the product's actual category

      if (existing) {
        db.prepare(`
          UPDATE products SET name = ?, short_description = ?, description = ?, category_id = ?,
          specs = ?, colors = ?, image_main = ?, images = ?, min_order = ?, units_per_box = ?,
          box_weight = ?, box_dimensions = ?, personalization_techniques = ?,
          source_url = ?, price = ?, last_synced_at = datetime('now'), updated_at = datetime('now')
          WHERE id = ?
        `).run(
          data.name, data.short_description || null, data.description || null, categoryId,
          data.specs ? JSON.stringify(data.specs) : null,
          data.colors ? JSON.stringify(data.colors) : null,
          data.image_main || null,
          data.images ? JSON.stringify(data.images) : null,
          data.min_order || null, data.units_per_box || null,
          data.box_weight || null, data.box_dimensions || null,
          data.personalization_techniques ? JSON.stringify(data.personalization_techniques) : null,
          data.source_url || null, data.price || null, existing.id
        );
        return 'updated';
      } else {
        // Ensure unique slug
        let finalSlug = slug;
        let counter = 1;
        while (db.prepare('SELECT id FROM products WHERE slug = ?').get(finalSlug)) {
          finalSlug = `${slug}-${counter}`;
          counter++;
        }

        db.prepare(`
          INSERT INTO products (supplier, supplier_sku, name, slug, short_description, description, category_id,
          specs, colors, image_main, images, min_order, units_per_box, box_weight, box_dimensions,
          personalization_techniques, source_url, price, is_active, is_new, last_synced_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, datetime('now'))
        `).run(
          this.supplier, data.supplier_sku, data.name, finalSlug,
          data.short_description || null, data.description || null, categoryId,
          data.specs ? JSON.stringify(data.specs) : null,
          data.colors ? JSON.stringify(data.colors) : null,
          data.image_main || null,
          data.images ? JSON.stringify(data.images) : null,
          data.min_order || null, data.units_per_box || null,
          data.box_weight || null, data.box_dimensions || null,
          data.personalization_techniques ? JSON.stringify(data.personalization_techniques) : null,
          data.source_url || null, data.price || null
        );
        return 'new';
      }
    } catch {
      return 'error';
    }
  }

  async downloadImage(url: string, filename: string): Promise<string> {
    const dir = path.join(process.cwd(), 'public', 'images', 'products', this.supplier);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, filename);
    if (fs.existsSync(filePath)) return `/images/products/${this.supplier}/${filename}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(filePath, buffer);
      return `/images/products/${this.supplier}/${filename}`;
    } catch {
      return url; // fallback to remote URL
    }
  }

  async run(onProgress?: (stats: ImportStats) => void): Promise<ImportStats> {
    this.startRun();
    try {
      for await (const product of this.fetchProducts()) {
        this.stats.total_found++;
        const result = this.upsertProduct(product);
        if (result === 'new') this.stats.new_added++;
        else if (result === 'updated') this.stats.updated++;
        else {
          this.stats.errors++;
          this.stats.error_log.push(`Error processing SKU ${product.supplier_sku}: ${product.name}`);
        }
        if (onProgress) onProgress(this.stats);
      }
      this.finishRun();
    } catch (err) {
      this.failRun(String(err));
      throw err; // Re-throw so caller can handle the error
    }
    return this.stats;
  }
}
