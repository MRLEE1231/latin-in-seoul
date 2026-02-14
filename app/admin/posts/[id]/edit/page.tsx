import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditPostForm from './EditPostForm';
import EditPostImagesSection from './EditPostImagesSection';

const DAY_OPTIONS = [
  { label: '월', value: 'MON' },
  { label: '화', value: 'TUE' },
  { label: '수', value: 'WED' },
  { label: '목', value: 'THU' },
  { label: '금', value: 'FRI' },
  { label: '토', value: 'SAT' },
  { label: '일', value: 'SUN' },
];

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = parseInt(id, 10);
  if (isNaN(postId)) notFound();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { images: { orderBy: { imageOrder: 'asc' } } },
  });
  if (!post) notFound();

  const classDaysSet = new Set((post.classDays || '').split(',').filter(Boolean));

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-slate-600 mb-2 inline-block">
          ← 관리자 목록으로
        </Link>
        <h1 className="text-3xl font-bold">수업 수정 (Admin)</h1>
        <p className="text-sm text-gray-500 mt-1">제목: {post.title || '제목 없음'}</p>
      </header>

      <EditPostForm>
        <input type="hidden" name="id" value={post.id} />

        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700">제목</label>
          <input
            type="text"
            id="title"
            name="title"
            defaultValue={post.title ?? ''}
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
              defaultValue={post.region ?? 'GANGNAM'}
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
              defaultValue={post.danceType ?? 'SALSA'}
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
            defaultValue={post.instructorName ?? ''}
            placeholder="예: 마이클"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-slate-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">수업 요일 (복수 선택 가능)</label>
          <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {DAY_OPTIONS.map((day) => (
              <label key={day.value} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="classDays"
                  value={day.value}
                  defaultChecked={classDaysSet.has(day.value)}
                  className="w-4 h-4 text-slate-600 rounded focus:ring-slate-500"
                />
                <span className="text-sm text-gray-700 font-medium">{day.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700">개강일 (선택)</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              defaultValue={post.startDate ? new Date(post.startDate).toISOString().slice(0, 10) : ''}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-slate-500 focus:outline-none transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700">종강일 (선택)</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              defaultValue={post.endDate ? new Date(post.endDate).toISOString().slice(0, 10) : ''}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-slate-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-semibold text-gray-700">본문 내용 (선택)</label>
          <textarea
            id="content"
            name="content"
            rows={5}
            defaultValue={post.content}
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
            defaultValue={post.keywords ? post.keywords.split(',').filter(Boolean).map((k) => `#${k.trim()}`).join('') : ''}
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
            defaultValue={post.classDescription ?? ''}
            placeholder="예: 매주 화요일 저녁 8시 진행"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-slate-500 focus:outline-none transition-colors"
          />
        </div>

        <EditPostImagesSection existingImages={post.images.map((img) => ({ id: img.id, imageUrl: img.imageUrl, imageOrder: img.imageOrder }))} />
      </EditPostForm>
    </div>
  );
}
