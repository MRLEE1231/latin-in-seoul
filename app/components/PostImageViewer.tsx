'use client';

import { useState } from 'react';

export default function PostImageViewer({ images }: { images: { id: string; imageUrl: string }[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      <div className="flex flex-col gap-1 overflow-hidden bg-gray-100">
        {images.map((image) => (
          <div 
            key={image.id} 
            className="relative cursor-pointer overflow-hidden"
            onClick={() => setSelectedImage(image.imageUrl)}
          >
            <img
              src={image.imageUrl}
              alt="수업 이미지"
              className="w-full h-auto object-cover transition hover:opacity-95"
            />
          </div>
        ))}
      </div>

      {/* 전체 화면 모달 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 transition-opacity cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white text-4xl font-light hover:text-gray-300 z-50"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
          >
            &times;
          </button>
          <img
            src={selectedImage}
            alt="전체 화면 이미지"
            className="max-h-full max-w-full rounded-sm object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
