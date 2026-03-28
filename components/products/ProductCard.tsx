import Link from 'next/link';

interface ProductCardProps {
  id: number;
  name: string;
  slug: string;
  image_main: string | null;
  category_name: string | null;
  supplier: string;
  is_new: number;
  is_featured: number;
}

export default function ProductCard({ name, slug, image_main, category_name, is_new, is_featured }: ProductCardProps) {
  return (
    <Link href={`/catalogo/${slug}`} className="product-card bg-white rounded-lg shadow-sm overflow-hidden block">
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
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {is_new ? <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">Novo</span> : null}
          {is_featured ? <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded">Destaque</span> : null}
        </div>
      </div>
      <div className="p-3">
        {category_name && (
          <span className="text-xs text-blue-600 font-medium uppercase">{category_name}</span>
        )}
        <h3 className="text-sm font-medium text-gray-900 mt-1 line-clamp-2">{name}</h3>
      </div>
    </Link>
  );
}
