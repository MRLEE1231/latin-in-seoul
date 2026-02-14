'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deletePostImage } from '../../../actions';
import { useEditPostFormContext } from './EditPostFormContext';

type ExistingImage = { id: number; imageUrl: string; imageOrder: number };

type NewPreviewItem = { id: string; url: string };

export default function EditPostImagesSection({ existingImages }: { existingImages: ExistingImage[] }) {
  const router = useRouter();
  const { newFilesRef } = useEditPostFormContext() ?? { newFilesRef: { current: [] } };
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<NewPreviewItem[]>([]);

  useEffect(() => {
    newFilesRef.current = newFiles;
  }, [newFiles, newFilesRef]);

  useEffect(() => {
    return () => {
      newPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [newPreviews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) {
      setNewFiles([]);
      setNewPreviews((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.url));
        return [];
      });
      return;
    }
    const fileList = Array.from(files);
    setNewFiles(fileList);
    setNewPreviews((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return fileList.map((file, i) => ({
        id: `${file.name}-${i}-${Date.now()}`,
        url: URL.createObjectURL(file),
      }));
    });
    e.target.value = '';
  };

  const removeNewPreviewAt = (index: number) => {
    setNewPreviews((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExisting = async (imageId: number) => {
    if (!confirm('이 이미지를 삭제할까요?')) return;
    setDeletingId(imageId);
    try {
      await deletePostImage(imageId);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  const totalCount = existingImages.length + newPreviews.length;

  return (
    <>
      <div className="space-y-2">
        <span className="block text-sm font-semibold text-gray-700">
          현재 이미지 (저장 시 반영될 목록 · 총 {totalCount}장)
        </span>
        <div className="flex flex-wrap gap-2">
          {/* 기존 이미지 */}
          {existingImages.map((img) => (
            <div
              key={img.id}
              className="relative rounded-lg border border-gray-200 overflow-hidden bg-gray-50"
            >
              <button
                type="button"
                onClick={() => setPreviewUrl(img.imageUrl)}
                className="block h-20 w-20 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 rounded-lg"
              >
                <img src={img.imageUrl} alt="" className="h-20 w-20 object-cover" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteExisting(img.id)}
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
          {/* 추가 예정 미리보기 (휴지통으로 제거 가능) */}
          {newPreviews.map((p, index) => (
            <div key={p.id} className="relative rounded-lg border border-slate-300 border-dashed overflow-hidden bg-slate-50">
              <img src={p.url} alt="추가 예정" className="h-20 w-20 object-cover" />
              <span className="absolute bottom-0 left-0 right-0 bg-slate-600/80 text-white text-[10px] py-0.5 text-center">
                추가 예정
              </span>
              <button
                type="button"
                onClick={() => removeNewPreviewAt(index)}
                className="absolute right-1 top-1 p-1 rounded-full bg-red-500/90 text-white focus:outline-none focus:ring-2 focus:ring-red-400"
                title="추가 목록에서 제거"
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
        <div className="pt-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">이미지 추가 (기존 유지 + 새 파일)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
          />
          <p className="text-xs text-gray-400 italic mt-1">파일을 선택하면 위 목록에 추가 예정으로 표시됩니다. 저장 시 반영됩니다.</p>
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
