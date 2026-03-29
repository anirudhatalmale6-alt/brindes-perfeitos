'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Slide {
  id: number;
  title: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
  image_url?: string;
  bg_color?: string;
}

interface HeroBannerProps {
  slides?: Slide[];
  totalProducts?: number;
}

const defaultSlides: Slide[] = [
  {
    id: 1,
    title: 'Brindes Promocionais Personalizados',
    subtitle: 'Encontre o brinde perfeito para sua empresa. Melhor qualidade, melhor preco e melhor servico.',
    cta_text: 'Ver Catalogo',
    cta_link: '/catalogo',
  },
  {
    id: 2,
    title: 'Monte seu Carrinho',
    subtitle: 'Personalizacao com a sua marca. Milhares de opcoes para sua empresa se destacar.',
    cta_text: 'Adicionar ao Carrinho',
    cta_link: '/contato',
  },
  {
    id: 3,
    title: 'Novidades Toda Semana',
    subtitle: 'Confira os produtos mais recentes adicionados ao nosso catalogo promocional.',
    cta_text: 'Ver Novidades',
    cta_link: '/categorias/novidades',
  },
];

export default function HeroBanner({ slides, totalProducts }: HeroBannerProps) {
  const allSlides = slides && slides.length > 0 ? slides : defaultSlides;
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % allSlides.length);
  }, [allSlides.length]);

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + allSlides.length) % allSlides.length);
  }, [allSlides.length]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = allSlides[current];

  return (
    <section className="relative w-full" style={{ aspectRatio: '1920 / 500' }}>
      {/* Background */}
      {slide.image_url ? (
        <img
          src={slide.image_url}
          alt={slide.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 hero-gradient" />
      )}

      {/* Overlay for text readability */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4 drop-shadow-lg">
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-4 md:mb-6 drop-shadow max-w-xl">
                {slide.subtitle}
                {totalProducts && totalProducts > 0 ? ` Mais de ${totalProducts.toLocaleString('pt-BR')} produtos disponiveis.` : ''}
              </p>
            )}
            {slide.cta_text && slide.cta_link && (
              <Link
                href={slide.cta_link}
                className="inline-block bg-amber-500 text-white px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold hover:bg-amber-600 text-sm md:text-lg shadow-lg"
              >
                {slide.cta_text}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {allSlides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors"
            aria-label="Anterior"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors"
            aria-label="Proximo"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {allSlides.length > 1 && (
        <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {allSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-colors ${
                i === current ? 'bg-white' : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
