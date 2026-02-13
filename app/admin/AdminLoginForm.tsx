'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from './auth-actions';

export default function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const result = await login(formData);

    if (result.success) {
      router.refresh();
      return;
    }

    setPending(false);
    setError(result.error);

    if (result.error === '권한이 없습니다.') {
      alert('권한이 없습니다.');
      window.location.href = '/';
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
        <h1 className="text-xl font-bold text-center text-gray-900 mb-6">관리자 로그인</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && error !== '권한이 없습니다.' && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              아이디
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-slate-500 focus:outline-none"
              placeholder="아이디"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-slate-500 focus:outline-none"
              placeholder="비밀번호"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-slate-600 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-60 transition-colors"
          >
            {pending ? '로그인 중…' : '로그인'}
          </button>
        </form>
        <p className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-slate-600">
            ← 메인으로
          </a>
        </p>
      </div>
    </div>
  );
}
