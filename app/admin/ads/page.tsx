import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DeleteAdButton from './DeleteAdButton';

export default async function AdminAdsPage() {
  const ads = await prisma.homeAd.findMany({
    orderBy: { order: 'asc' },
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <header className="mb-8 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">메인 페이지 광고 관리</h1>
          <p className="text-sm text-gray-500 mt-1">홈 추천 섹션에 노출되는 광고를 등록·수정·삭제합니다.</p>
        </div>
        <Link
          href="/admin/ads/new"
          className="rounded-xl bg-slate-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-slate-700"
        >
          + 광고 등록
        </Link>
        <Link
          href="/admin"
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← 목록으로
        </Link>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
              <tr>
                <th className="px-4 py-3 w-16 text-center">종류</th>
                <th className="px-4 py-3 w-24 text-center">미리보기</th>
                <th className="px-4 py-3">제목</th>
                <th className="px-4 py-3">링크</th>
                <th className="px-4 py-3 w-20 text-center">순서</th>
                <th className="px-4 py-3 w-32 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                    등록된 광고가 없습니다. &quot;광고 등록&quot;으로 추가하세요.
                  </td>
                </tr>
              ) : (
                ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-medium text-gray-600">
                        {ad.kind === 'CLASS' ? '수업' : '기타'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-12 w-20 overflow-hidden rounded bg-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ad.image} alt="" className="h-full w-full object-cover" />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{ad.title}</td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-[180px]" title={ad.href}>
                      {ad.href}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{ad.order}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/ads/${ad.id}/edit`}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          수정
                        </Link>
                        <DeleteAdButton id={ad.id} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
