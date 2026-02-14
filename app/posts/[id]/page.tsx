import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import PostImageViewer from '@/app/components/PostImageViewer';

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = parseInt(id);

  if (isNaN(postId)) notFound();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      images: { orderBy: { imageOrder: 'asc' } },
    },
  });

  if (!post) notFound();

  const regionMap: Record<string, string> = {
    GANGNAM: '강남',
    HONGDAE: '홍대',
    ETC: '기타',
  };

  const danceTypeMap: Record<string, string> = {
    SALSA: '살사',
    BACHATA: '바차타',
    KIZOMBA: '키좀바',
    ZOUK: '주크',
    ETC: '기타',
  };

  const dayMap: Record<string, string> = {
    MON: '월',
    TUE: '화',
    WED: '수',
    THU: '목',
    FRI: '금',
    SAT: '토',
    SUN: '일',
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-20">
      {/* 상단 네비게이션: 라이트/다크 모두에서 대비 확보 */}
      <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/95 px-4 py-3 backdrop-blur-md">
        <Link href="/posts" className="p-1 text-gray-900 dark:text-gray-100 hover:opacity-70">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">게시물</span>
        <div className="w-8" />
      </nav>

      <main className="mx-auto max-w-xl overflow-hidden">
        {/* 이미지 섹션 */}
        <PostImageViewer images={post.images.map(img => ({ id: img.id.toString(), imageUrl: img.imageUrl }))} />

        {/* 본문: 항목별 정리 */}
        <div className="px-4 pb-6 border-t border-gray-100">
          <dl className="divide-y divide-gray-100 text-sm">
            {post.title && (
              <div className="py-3">
                <dt className="text-xs font-bold text-gray-400 mb-1">제목</dt>
                <dd className="text-gray-900 font-medium">{post.title}</dd>
              </div>
            )}
            {post.instructorName && (
              <div className="py-3">
                <dt className="text-xs font-bold text-gray-400 mb-1">강사</dt>
                <dd className="text-gray-900">{post.instructorName}</dd>
              </div>
            )}
            {post.region && (
              <div className="py-3">
                <dt className="text-xs font-bold text-gray-400 mb-1">지역</dt>
                <dd className="text-gray-900">
                  {post.region.split(',').map((r) => r.trim()).filter(Boolean).map((r) => regionMap[r] || r).join(' · ')}
                </dd>
              </div>
            )}
            {(post.startDate || post.endDate) && (
              <div className="py-3">
                <dt className="text-xs font-bold text-gray-400 mb-1">기간</dt>
                <dd className="text-gray-900">
                  {post.startDate && post.endDate
                    ? `${new Date(post.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(post.endDate).toLocaleDateString('ko-KR')}`
                    : post.startDate
                    ? `${new Date(post.startDate).toLocaleDateString('ko-KR')} ~`
                    : `~ ${post.endDate ? new Date(post.endDate).toLocaleDateString('ko-KR') : ''}`}
                </dd>
              </div>
            )}
            {post.danceType && (
              <div className="py-3">
                <dt className="text-xs font-bold text-gray-400 mb-1">종류</dt>
                <dd className="text-gray-900">{danceTypeMap[post.danceType] || post.danceType}</dd>
              </div>
            )}
            {(post as { classDays?: string }).classDays && (
              <div className="py-3">
                <dt className="text-xs font-bold text-gray-400 mb-1">요일</dt>
                <dd className="text-gray-900">
                  {(post as { classDays: string }).classDays.split(',').map((d: string) => dayMap[d] || d).join(' · ')}
                </dd>
              </div>
            )}
            {post.content?.trim() && (
              <div className="py-3">
                <dt className="text-xs font-bold text-gray-400 mb-1">본문</dt>
                <dd className="text-gray-800 whitespace-pre-wrap leading-snug">{post.content}</dd>
              </div>
            )}
            {(post as { keywords?: string }).keywords && (
              <div className="py-3">
                <dt className="text-xs font-bold text-gray-400 mb-1">키워드</dt>
                <dd className="text-slate-600 flex flex-wrap gap-x-2 gap-y-1">
                  {(post as { keywords: string }).keywords.split(',').filter(Boolean).map((k) => (
                    <span key={k}>#{k.trim()}</span>
                  ))}
                </dd>
              </div>
            )}
            {post.classDescription && (
              <div className="py-3">
                <dt className="text-xs font-bold text-gray-400 mb-1">수업 요약</dt>
                <dd className="text-gray-700">{post.classDescription}</dd>
              </div>
            )}
            <div className="py-3">
              <dt className="text-xs font-bold text-gray-400 mb-1">등록일</dt>
              <dd className="text-gray-500 text-xs">
                {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
