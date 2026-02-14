'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deletePostImage } from '../../../actions';

type ImageItem = { id: number; imageUrl: string; imageOrder: number };

export default function CurrentImagesEditor({ images }: { images: ImageItem[] }) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (imageId: number) => {
    if (!confirm('이 이미지를 삭제할까요?')) return;
    setDeletingId(imageId);
    try {
      await deletePostImage(imageId);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  if (images.length === 0) return null;

  return (
    <>
      <div className="space-y-2">
        <span className="block text-sm font-semibold text-gray-700">
          현재 이미지 ({images.length}장) — 클릭 시 원본 크기로 보기, 휴지통으로 삭제
        </span>
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group rounded-lg border border-gray-200 overflow-hidden bg-gray-50"
            >
              <button
                type="button"
                onClick={() => setPreviewUrl(img.imageUrl)}
                className="block h-20 w-20 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 rounded-lg"
              >
                <img
                  src={img.imageUrl}
                  alt=""
                  className="h-20 w-20 object-cover"
                />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                disabled={deletingId === img.id}
                className="absolute right-1 top-1 p-1 rounded-full bg-red-500/90 text-white focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50"
                title="이미지 삭제"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 원본 크기 미리보기 모달 */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="이미지 원본 보기"
        >
          <button
            type="button"
            onClick={() => setPreviewUrl(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="닫기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            src={previewUrl}
            alt="원본 크기"
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
