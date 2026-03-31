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

  return (
    <div>
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
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
      </div>
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
