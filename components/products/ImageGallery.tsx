'use client';

import { useState } from 'react';

interface ImageGalleryProps {
  mainImage: string | null;
  images: string[];
  productName: string;
}

export default function ImageGallery({ mainImage, images, productName }: ImageGalleryProps) {
  // Build full image list: main image first, then additional images (no duplicates)
  const allImages: string[] = [];
  if (mainImage) allImages.push(mainImage);
  for (const img of images) {
    if (img && !allImages.includes(img)) allImages.push(img);
  }

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = allImages[selectedIndex] || null;

  function goNext() {
    setSelectedIndex(prev => (prev + 1) % allImages.length);
  }

  function goPrev() {
    setSelectedIndex(prev => (prev - 1 + allImages.length) % allImages.length);
  }

  return (
    <div>
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
        {selectedImage ? (
          <img
            src={selectedImage}
            alt={productName}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Navigation arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-colors"
              aria-label="Imagem anterior"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-colors"
              aria-label="Proxima imagem"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Image counter */}
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {selectedIndex + 1} / {allImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {allImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`aspect-square bg-gray-100 rounded overflow-hidden border-2 transition-colors ${
                i === selectedIndex ? 'border-lime-500' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
