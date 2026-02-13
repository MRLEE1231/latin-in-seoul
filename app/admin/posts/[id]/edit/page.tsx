import { updatePost } from '../../../actions';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

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

      <form action={updatePost} className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
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

        {post.images.length > 0 && (
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-gray-700">현재 이미지 ({post.images.length}장)</span>
            <div className="flex flex-wrap gap-2">
              {post.images.map((img) => (
                <img
                  key={img.id}
                  src={img.imageUrl}
                  alt=""
                  className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">이미지 추가 (기존 유지 + 새 파일)</label>
          <input
            type="file"
            name="images"
            multiple
            accept="image/*"
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
          />
          <p className="text-xs text-gray-400 italic">추가할 이미지만 선택하세요. 기존 이미지는 그대로 유지됩니다.</p>
        </div>

        <div className="pt-4 flex gap-3">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-slate-600 px-6 py-3 font-bold text-white shadow-lg transition-all hover:bg-slate-700 active:scale-[0.98]"
          >
            수정 저장
          </button>
          <Link
            href="/admin"
            className="rounded-xl border border-gray-300 px-6 py-3 font-bold text-gray-600 hover:bg-gray-50 transition-all text-center"
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
