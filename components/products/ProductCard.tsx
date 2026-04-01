'use client';

import Link from 'next/link';
import AddToCartButton from './AddToCartButton';

interface ColorInfo {
  name: string;
  code?: string;
  hex?: string;
}

interface PricingTier {
  min_qty: number;
  unit_price: number;
}

interface ProductCardProps {
  id: number;
  name: string;
  slug: string;
  image_main: string | null;
  category_name: string | null;
  supplier?: string;
  supplier_sku?: string | null;
  min_order?: number | null;
  colors?: string | null;
  units_per_box?: number | null;
  price?: number | null;
  pricing_tiers?: PricingTier[] | null;
  is_new: number;
  is_featured: number;
}

// Map common color names to hex values
const colorNameToHex: Record<string, string> = {
  'preto': '#000000', 'black': '#000000', 'negro': '#000000',
  'branco': '#FFFFFF', 'white': '#FFFFFF',
  'vermelho': '#EF4444', 'red': '#EF4444', 'encarnado': '#EF4444',
  'azul': '#3B82F6', 'blue': '#3B82F6', 'azul marinho': '#1E3A5F', 'navy': '#1E3A5F', 'navy blue': '#1E3A5F',
  'verde': '#22C55E', 'green': '#22C55E', 'verde escuro': '#166534',
  'amarelo': '#EAB308', 'yellow': '#EAB308',
  'laranja': '#F97316', 'orange': '#F97316',
  'rosa': '#EC4899', 'pink': '#EC4899',
  'roxo': '#A855F7', 'purple': '#A855F7',
  'cinza': '#6B7280', 'cinzento': '#6B7280', 'gray': '#6B7280', 'grey': '#6B7280',
  'marrom': '#92400E', 'castanho': '#92400E', 'brown': '#92400E',
  'prata': '#C0C0C0', 'silver': '#C0C0C0', 'prateado': '#C0C0C0',
  'dourado': '#D4A843', 'gold': '#D4A843', 'ouro': '#D4A843',
  'bege': '#D2B48C', 'beige': '#D2B48C',
  'coral': '#FF7F50',
  'turquesa': '#40E0D0', 'turquoise': '#40E0D0',
  'borgonha': '#800020', 'bordeaux': '#800020', 'vinho': '#800020',
  'caqui': '#C3B091', 'khaki': '#C3B091',
  'natural': '#E8DCC8',
  'transparente': '#E5E7EB', 'inox': '#D1D5DB', 'chumbo': '#4B5563',
  'bronze': '#CD7F32', 'cobre': '#B87333', 'bambu': '#D4A76A',
  'kraft': '#C4A882', 'madeira': '#8B6914', 'colorido': '#8B5CF6',
  // SpotGifts numeric color codes
  '102': '#1E3A5F', '103': '#000000', '104': '#3B82F6', '105': '#87CEEB',
  '106': '#FFFFFF', '107': '#EF4444', '108': '#22C55E', '109': '#EAB308',
  '110': '#F97316', '111': '#EC4899', '112': '#6B7280', '113': '#92400E',
  '114': '#C0C0C0', '115': '#D4A843', '116': '#A855F7', '117': '#E8DCC8',
  '118': '#D2B48C', '119': '#1E3A5F', '120': '#800020', '121': '#40E0D0',
  '123': '#4B5563', '124': '#86EFAC', '127': '#7C3AED', '128': '#F472B6',
  '131': '#991B1B', '132': '#E8DCC8', '133': '#D2B48C', '134': '#E5E7EB',
  '147': '#C4A882', '150': '#166534', '160': '#7DD3FC', '167': '#E8B4B8',
  '170': '#374151',
};

function getColorHex(color: ColorInfo): string | null {
  if (color.hex) return color.hex;
  if (color.code) {
    const lower = color.code.toLowerCase();
    if (colorNameToHex[lower]) return colorNameToHex[lower];
  }
  const lower = color.name.toLowerCase().trim();
  // Try exact match first
  if (colorNameToHex[lower]) return colorNameToHex[lower];
  // Try partial match
  for (const [key, hex] of Object.entries(colorNameToHex)) {
    if (lower.includes(key) || key.includes(lower)) return hex;
  }
  return null;
}

export default function ProductCard({ id, name, slug, image_main, category_name, supplier_sku, min_order, colors, units_per_box, price, pricing_tiers, is_new, is_featured }: ProductCardProps) {
  let parsedColors: ColorInfo[] = [];
  try {
    if (colors) parsedColors = JSON.parse(colors);
  } catch { /* ignore */ }

  return (
    <div className="product-card bg-white rounded-lg shadow-sm overflow-hidden">
      <Link href={`/catalogo/${slug}`} className="block">
        <div className="relative aspect-square bg-gray-100">
          {image_main ? (
            <img src={image_main} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1">
            {is_new ? <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">Novo</span> : null}
            {is_featured ? <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded">Destaque</span> : null}
          </div>
          {units_per_box && units_per_box > 0 && (
            <div className="absolute bottom-2 left-2">
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                Disponivel: {units_per_box.toLocaleString('pt-BR')}
              </span>
            </div>
          )}
        </div>
        <div className="p-3 pb-1">
          {category_name && (
            <span className="text-xs text-lime-600 font-medium uppercase">{category_name}</span>
          )}
          <h3 className="text-sm font-medium text-gray-900 mt-1 line-clamp-2">{name}</h3>
          {pricing_tiers && pricing_tiers.length > 0 ? (
            <p className="text-sm font-bold text-green-700 mt-1">
              A partir de R$ {pricing_tiers[0].unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          ) : price && price > 0 ? (
            <p className="text-sm font-bold text-green-700 mt-1">
              A partir de R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          ) : null}
          {/* Color dots */}
          {parsedColors.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {parsedColors.slice(0, 8).map((color, idx) => {
                const hex = getColorHex(color);
                return hex ? (
                  <span
                    key={idx}
                    className="w-4 h-4 rounded-full border border-gray-300 inline-block"
                    style={{ backgroundColor: hex }}
                    title={color.name}
                  />
                ) : (
                  <span
                    key={idx}
                    className="text-[10px] text-gray-500 bg-gray-100 px-1 rounded"
                    title={color.name}
                  >
                    {color.name.slice(0, 8)}
                  </span>
                );
              })}
              {parsedColors.length > 8 && (
                <span className="text-[10px] text-gray-400">+{parsedColors.length - 8}</span>
              )}
            </div>
          )}
          {min_order && min_order > 1 && (
            <p className="text-xs text-amber-600 mt-1">Min: {min_order} un.</p>
          )}
        </div>
      </Link>
      <div className="px-3 pb-3 pt-1">
        <AddToCartButton
          product={{ id, name, slug, image_main, supplier_sku: supplier_sku || null, category_name, min_order }}
          quantity={min_order || 1}
        />
      </div>
    </div>
  );
}
