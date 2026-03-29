'use client';

import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  product_count: number;
}

// SVG icons for each category slug
function getCategoryIcon(slug: string): JSX.Element {
  const iconClass = "w-8 h-8 text-white";
  switch (slug) {
    case 'bar-e-cozinha-personalizados':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'squeezes-personalizadas':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3h6l1 4H8l1-4zM8 7h8v2a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm1 3h6v10a2 2 0 01-2 2h-2a2 2 0 01-2-2V10z" /></svg>;
    case 'canetas-personalizadas':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
    case 'chaveiros-personalizados':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>;
    case 'mochilas-personalizadas':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
    case 'produtos-ecologicos-personalizados':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'eletronicos-personalizados':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
    case 'pen-drives-personalizados':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
    case 'guarda-chuvas-personalizados':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m-7-9H4m16 0h1m-2.636-6.364l-.707.707M6.343 6.343l-.707.707M12 7a5 5 0 015 5H7a5 5 0 015-5zm0 5v6a2 2 0 01-2 2" /></svg>;
    case 'novidades':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
    default:
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
  }
}

export default function CategoryStrip({ categories }: { categories: Category[] }) {
  // Only show main categories (no subcategories), with Novidades at the end
  const mainCats = categories.filter(c => !c.parent_id);
  const novidades = mainCats.filter(c => c.slug === 'novidades');
  const others = mainCats.filter(c => c.slug !== 'novidades');
  const displayCategories = [...others, ...novidades];

  return (
    <section className="bg-amber-500 py-4 overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 min-w-max">
          {/* All categories link */}
          <Link href="/categorias" className="flex flex-col items-center px-4 py-2 hover:bg-amber-600 rounded-lg transition-colors min-w-[100px]">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-white text-xs font-semibold mt-1 text-center leading-tight">Todas as<br/>Categorias</span>
          </Link>

          {displayCategories.map(cat => (
            <Link key={cat.id} href={`/categorias/${cat.slug}`}
              className="flex flex-col items-center px-4 py-2 hover:bg-amber-600 rounded-lg transition-colors min-w-[100px]">
              {getCategoryIcon(cat.slug)}
              <span className="text-white text-xs font-semibold mt-1 text-center leading-tight max-w-[90px]">
                {cat.name.replace(' Personalizados', '').replace(' Personalizadas', '')}
                <br/>
                <span className="font-normal opacity-90">PERSONALIZADOS</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
