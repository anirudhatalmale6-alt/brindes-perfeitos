import { getDb } from './db';
import bcrypt from 'bcryptjs';

let initialized = false;

export function initializeDatabase() {
  if (initialized) return getDb();
  initialized = true;
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      image_url TEXT,
      parent_id INTEGER REFERENCES categories(id),
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier TEXT NOT NULL DEFAULT 'manual',
      supplier_sku TEXT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      short_description TEXT,
      description TEXT,
      category_id INTEGER REFERENCES categories(id),
      specs TEXT,
      colors TEXT,
      image_main TEXT,
      images TEXT,
      min_order INTEGER,
      units_per_box INTEGER,
      box_weight REAL,
      box_dimensions TEXT,
      personalization_techniques TEXT,
      print_colors_max INTEGER,
      is_active INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      source_url TEXT,
      last_synced_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(supplier, supplier_sku)
    );

    CREATE TABLE IF NOT EXISTS product_categories (
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
      PRIMARY KEY (product_id, category_id)
    );

    CREATE TABLE IF NOT EXISTS import_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      total_found INTEGER DEFAULT 0,
      new_added INTEGER DEFAULT 0,
      updated INTEGER DEFAULT 0,
      errors INTEGER DEFAULT 0,
      error_log TEXT,
      started_at TEXT DEFAULT (datetime('now')),
      finished_at TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quote_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id),
      product_name TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      whatsapp TEXT,
      company TEXT,
      quantity INTEGER,
      message TEXT,
      status TEXT DEFAULT 'new',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier, supplier_sku);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
    CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
  `);

  // Seed admin user if none exists
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
  if (adminCount.count === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admin_users (email, password_hash, name) VALUES (?, ?, ?)').run(
      'admin@brindesperfeitos.com.br', hash, 'Administrador'
    );
  }

  // Seed default settings
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
  if (settingsCount.count === 0) {
    const defaults = [
      ['site_name', 'Brindes Perfeitos'],
      ['site_tagline', 'Brindes Promocionais Personalizados'],
      ['contact_email', 'contato@brindesperfeitos.com.br'],
      ['contact_phone', ''],
      ['contact_whatsapp', ''],
      ['contact_address', ''],
    ];
    const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of defaults) {
      stmt.run(key, value);
    }
  }

  // Seed default categories
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (catCount.count === 0) {
    const categories = [
      ['Novidades', 'novidades'],
      ['Bar e Cozinha Personalizados', 'bar-e-cozinha-personalizados'],
      ['Squeezes Personalizadas', 'squeezes-personalizadas'],
      ['Canetas Personalizadas', 'canetas-personalizadas'],
      ['Chaveiros Personalizados', 'chaveiros-personalizados'],
      ['Mochilas Personalizadas', 'mochilas-personalizadas'],
      ['Produtos Ecologicos Personalizados', 'produtos-ecologicos-personalizados'],
      ['Eletronicos Personalizados', 'eletronicos-personalizados'],
      ['Pen Drives Personalizados', 'pen-drives-personalizados'],
      ['Guarda-chuvas Personalizados', 'guarda-chuvas-personalizados'],
      ['Blocos de Anotacoes Personalizados', 'blocos-de-anotacoes-personalizados'],
      ['Calculadoras Personalizadas', 'calculadoras-personalizadas'],
      ['Kits Diversos Personalizados', 'kits-diversos-personalizados'],
      ['Porta Cartao Personalizados', 'porta-cartao-personalizados'],
      ['Relogios Personalizados', 'relogios-personalizados'],
    ];
    const stmt = db.prepare('INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?)');
    categories.forEach(([name, slug], i) => {
      stmt.run(name, slug, i);
    });
  }

  return db;
}
