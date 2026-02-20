import Link from 'next/link';
import { createHomeAd } from '../actions';
import AdForm from '../AdForm';

export default function NewAdPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">광고 등록</h1>
        <p className="text-sm text-gray-500 mt-1">이미지 URL, 제목, 설명, 링크를 입력하세요.</p>
      </header>

      <AdForm action={createHomeAd} />

      <p className="mt-4">
        <Link href="/admin/ads" className="text-sm text-gray-500 hover:text-gray-700 underline">
          ← 광고 목록으로
        </Link>
      </p>
    </div>
  );
}
