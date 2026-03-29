'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/lib/cart-context';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const { totalItems } = useCart();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/catalogo?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-lime-700 text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <span>Brindes promocionais para sua empresa</span>
          <div className="flex items-center gap-4">
            <a href="https://wa.me/551127719911" className="hover:underline hidden sm:inline">(11) 2771-9911</a>
            <Link href="/carrinho" className="hover:underline">Monte seu carrinho de brindes</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 mr-4">
            <h1 className="text-3xl md:text-4xl font-bold text-lime-700">Brindes<span className="text-amber-500">Perfeitos</span></h1>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <input
              type="text"
              placeholder="Buscar brindes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            />
            <button type="submit" className="bg-lime-600 text-white px-6 py-2 rounded-r-lg hover:bg-lime-700">
              Buscar
            </button>
          </form>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/catalogo" className="text-gray-700 hover:text-lime-600 font-medium text-sm">Catalogo</Link>
            <Link href="/categorias" className="text-gray-700 hover:text-lime-600 font-medium text-sm">Categorias</Link>
            <Link href="/sobre" className="text-gray-700 hover:text-lime-600 font-medium text-sm">Sobre</Link>
            <Link href="/carrinho" className="relative bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 font-medium text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              Carrinho
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            <Link href="/carrinho" className="relative p-2">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <nav className="md:hidden mt-4 pb-4 border-t pt-4 space-y-3">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text" placeholder="Buscar brindes..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg"
              />
              <button type="submit" className="bg-lime-600 text-white px-4 py-2 rounded-r-lg">Buscar</button>
            </form>
            <Link href="/catalogo" className="block text-gray-700 hover:text-lime-600 font-medium">Catalogo</Link>
            <Link href="/categorias" className="block text-gray-700 hover:text-lime-600 font-medium">Categorias</Link>
            <Link href="/sobre" className="block text-gray-700 hover:text-lime-600 font-medium">Sobre</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
