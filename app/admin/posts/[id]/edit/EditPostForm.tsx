'use client';

import { useState, useRef } from 'react';
import { updatePost } from '../../../actions';
import { EditPostFormProvider } from './EditPostFormContext';

export default function EditPostForm({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState(false);
  const newFilesRef = useRef<File[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      (newFilesRef.current || []).forEach((file) => formData.append('images', file));
      await updatePost(formData);
    } finally {
      setPending(false);
    }
  }

  return (
    <EditPostFormProvider newFilesRef={newFilesRef}>
    <form
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-100"
    >
      {children}
      <div className="pt-4 flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl bg-slate-600 px-6 py-3 font-bold text-white shadow-lg transition-all hover:bg-slate-700 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
        >
          {pending ? '저장 중…' : '수정 저장'}
        </button>
        <a
          href="/admin"
          className="rounded-xl border border-gray-300 px-6 py-3 font-bold text-gray-600 hover:bg-gray-50 transition-all text-center"
        >
          취소
        </a>
      </div>
    </form>
    </EditPostFormProvider>
  );
}
