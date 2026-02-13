'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createPost } from '../../actions';

export default function NewPostForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const result = await createPost(formData);
      if (result.success) {
        router.push('/admin');
        return;
      }
      setError(result.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록 중 오류가 발생했습니다.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8">
        <Link href="/posts" className="text-sm text-gray-500 hover:text-slate-600 mb-2 inline-block">
          ← 목록으로 돌아가기
        </Link>
        <h1 className="text-3xl font-bold">새 수업 추가 (Admin)</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700">제목</label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="예: 강남 살사 초급반 모집"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-slate-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="region" className="block text-sm font-semibold text-gray-700">지역</label>
            <select
              id="region"
              name="region"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-slate-500 focus:outline-none transition-colors bg-white"
            >
              <option value="GANGNAM">강남</option>
              <option value="HONGDAE">홍대</option>
              <option value="ETC">기타</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="danceType" className="block text-sm font-semibold text-gray-700">수업 종류</label>
            <select
              id="danceType"
              name="danceType"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-slate-500 focus:outline-none transition-colors bg-white"
            >
              <option value="SALSA">살사</option>
              <option value="BACHATA">바차타</option>
              <option value="ZOUK">주크</option>
              <option value="KIZOMBA">키좀바</option>
              <option value="ETC">기타</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="instructorName" className="block text-sm font-semibold text-gray-700">강사명</label>
          <input
            type="text"
            id="instructorName"
            name="instructorName"
            placeholder="예: 마이클"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-slate-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">수업 요일 (복수 선택 가능)</label>
          <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {[
              { label: '월', value: 'MON' },
              { label: '화', value: 'TUE' },
              { label: '수', value: 'WED' },
              { label: '목', value: 'THU' },
              { label: '금', value: 'FRI' },
              { label: '토', value: 'SAT' },
              { label: '일', value: 'SUN' },
            ].map((day) => (
              <label key={day.value} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="classDays"
                  value={day.value}
                  className="w-4 h-4 text-slate-600 rounded focus:ring-slate-500"
                />
                <span className="text-sm text-gray-700 font-medium">{day.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-semibold text-gray-700">본문 내용 (선택)</label>
          <textarea
            id="content"
            name="content"
            rows={5}
            placeholder="수업에 대한 상세 내용을 입력하세요."
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-slate-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="keywords" className="block text-sm font-semibold text-gray-700">키워드 (선택)</label>
          <input
            type="text"
            id="keywords"
            name="keywords"
            placeholder="#초보#소셜#bachata (띄어쓰기 없이 #로 구분)"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-slate-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="classDescription" className="block text-sm font-semibold text-gray-700">수업 요약 설명 (선택)</label>
          <input
            type="text"
            id="classDescription"
            name="classDescription"
            placeholder="예: 매주 화요일 저녁 8시 진행"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-slate-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">이미지 파일 추가 (최대 5개)</label>
          <div className="space-y-2">
            <input
              type="file"
              name="images"
              multiple
              accept="image/*"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
            />
          </div>
          <p className="text-xs text-gray-400 italic">이미지 파일을 선택해 주세요. 여러 장을 한 번에 선택할 수 있습니다.</p>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-slate-600 px-6 py-3 font-bold text-white shadow-lg transition-all hover:bg-slate-700 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
          >
            {pending ? '등록 중…' : '수업 등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
