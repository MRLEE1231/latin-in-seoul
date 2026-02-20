import Link from 'next/link';
import Image from 'next/image';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import FilterSection from '@/app/components/FilterSection';
import PeriodFilter from '@/app/components/PeriodFilter';
import { getAdminSession } from '@/lib/auth';

const REGION_OPTIONS: { label: string; value?: string }[] = [
  { label: '전체', value: undefined },
  { label: '강남', value: 'GANGNAM' },
  { label: '홍대', value: 'HONGDAE' },
  { label: '기타', value: 'ETC' },
];

const DANCE_TYPE_OPTIONS: { label: string; value?: string }[] = [
  { label: '전체', value: undefined },
  { label: '살사', value: 'SALSA' },
  { label: '바차타', value: 'BACHATA' },
  { label: '주크', value: 'ZOUK' },
  { label: '키좀바', value: 'KIZOMBA' },
  { label: '기타', value: 'ETC' },
];

const DAY_OPTIONS: { label: string; value?: string }[] = [
  { label: '전체', value: undefined },
  { label: '월', value: 'MON' },
  { label: '화', value: 'TUE' },
  { label: '수', value: 'WED' },
  { label: '목', value: 'THU' },
  { label: '금', value: 'FRI' },
  { label: '토', value: 'SAT' },
  { label: '일', value: 'SUN' },
];

const regionLabelMap: Record<string, string> = {
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

function formatKeywords(keywords?: string | null, maxLength = 24) {
  if (!keywords) return '';
  const display = keywords
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `#${s}`)
    .join(' ');
  if (!display) return '';
  if (display.length <= maxLength) return display;
  return display.slice(0, maxLength) + '…';
}

function buildHref(region?: string, danceType?: string, day?: string, keyword?: string, periodFrom?: string, periodTo?: string) {
  const params = new URLSearchParams();
  if (region) params.set('region', region);
  if (danceType) params.set('danceType', danceType);
  if (day) params.set('day', day);
  if (keyword) params.set('keyword', keyword);
  if (periodFrom) params.set('periodFrom', periodFrom);
  if (periodTo) params.set('periodTo', periodTo);
  const qs = params.toString();
  return qs ? `/posts?${qs}` : '/posts';
}

// 게시글 목록 페이지 (갤러리 + 필터)
export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; danceType?: string; day?: string; keyword?: string; periodFrom?: string; periodTo?: string }>;
}) {
  const { region, danceType, day, keyword, periodFrom, periodTo } = await searchParams;

  const periodFromDate = periodFrom && periodFrom.trim() ? new Date(periodFrom.trim() + 'T00:00:00') : null;
  const periodToDate = periodTo && periodTo.trim() ? new Date(periodTo.trim() + 'T23:59:59') : null;

  // 수업 기간 필터: 기간 [periodFrom, periodTo]와 겹치는 수업만. 개강일 없음 = 최솟값(항상 포함), 종강일 없음 = 최댓값(항상 포함)
  const periodWhere: Prisma.PostWhereInput | undefined =
    periodFromDate || periodToDate
      ? ({
          AND: [
            ...(periodToDate
              ? [{ OR: [{ startDate: { lte: periodToDate } }, { startDate: { equals: null } }] }] // 개강일 없음 → 최솟값
              : []),
            ...(periodFromDate
              ? [{ OR: [{ endDate: { gte: periodFromDate } }, { endDate: { equals: null } }] }] // 종강일 없음 → 최댓값
              : []),
          ].filter(Boolean),
        } as Prisma.PostWhereInput)
      : undefined;

  // 지역이 쉼표로 복수 저장된 경우에도 필터 매칭 (예: region=GANGNAM → 'GANGNAM' 또는 'GANGNAM,HONGDAE' 등)
  const regionWhere: Prisma.PostWhereInput | undefined = region
    ? ({
        OR: [
          { region: { equals: region } },
          { region: { startsWith: `${region},` } },
          { region: { endsWith: `,${region}` } },
          { region: { contains: `,${region},` } },
        ],
      } as Prisma.PostWhereInput)
    : undefined;

  const posts = await prisma.post.findMany({
    where: {
      ...(regionWhere && regionWhere),
      ...(danceType && { danceType }),
      ...(day && { classDays: { contains: day } }),
      ...(keyword && keyword.trim() && { keywords: { contains: keyword.trim() } }),
      ...(periodWhere && periodWhere),
    },
    include: {
      images: {
        orderBy: { imageOrder: 'asc' },
        take: 1, // 대표 이미지 1장
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const adminSession = await getAdminSession();

  return (
    <div className="container mx-auto px-4 pt-4 pb-10">
      <header className="mb-6 space-y-2">
        <FilterSection
          initialDetailed={Boolean(day || keyword || periodFrom || periodTo)}
          leftExtra={
            adminSession ? (
              <Link
                href="/admin"
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-600 hover:text-white transition-colors"
              >
                관리자 페이지로 이동
              </Link>
            ) : null
          }
        >
          {/* 지역 필터 */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-gray-400 w-8 shrink-0 whitespace-nowrap">지역</span>
            <div className="flex flex-wrap gap-2">
              {REGION_OPTIONS.map((opt) => {
                const active = region === (opt.value ?? undefined);
                const href = buildHref(opt.value, danceType, day, keyword, periodFrom, periodTo);
                return (
                  <Link
                    key={opt.label}
                    href={href}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      active
                        ? 'border-slate-600 bg-slate-600 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 종류 필터 */}
          <div className="flex items-center gap-3 border-t border-gray-50 pt-3">
            <span className="text-xs font-bold text-gray-400 w-8 shrink-0 whitespace-nowrap">종류</span>
            <div className="flex flex-nowrap gap-2 overflow-x-auto min-w-0 py-1 hide-scrollbar">
              {DANCE_TYPE_OPTIONS.map((opt) => {
                const active = danceType === (opt.value ?? undefined);
                const href = buildHref(region, opt.value, day, keyword, periodFrom, periodTo);
                return (
                  <Link
                    key={opt.label}
                    href={href}
                    className={`shrink-0 rounded-full border px-3 py-1 text-sm transition-colors whitespace-nowrap ${
                      active
                        ? 'border-slate-600 bg-slate-600 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 기간: 값 선택 시 즉시 조회 (지역/종류와 동일, 한 줄 배치) */}
          <div className="detailed-only hidden flex items-center gap-3 border-t border-gray-50 pt-3">
            <PeriodFilter
              region={region}
              danceType={danceType}
              day={day}
              keyword={keyword}
              periodFrom={periodFrom}
              periodTo={periodTo}
            />
          </div>

          {/* 요일 + 키워드: 폼으로 제출 */}
          <form method="get" action="/posts" className="detailed-only hidden flex flex-col gap-0 border-t border-gray-50 pt-3" key={`detail-${keyword ?? ''}`}>
            {region && <input type="hidden" name="region" value={region} />}
            {danceType && <input type="hidden" name="danceType" value={danceType} />}
            {day && <input type="hidden" name="day" value={day} />}
            {periodFrom && <input type="hidden" name="periodFrom" value={periodFrom} />}
            {periodTo && <input type="hidden" name="periodTo" value={periodTo} />}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 w-8 shrink-0 whitespace-nowrap">요일</span>
              <div className="flex flex-nowrap gap-2 overflow-x-auto min-w-0 py-1 hide-scrollbar">
                {DAY_OPTIONS.map((opt) => {
                  const active = day === (opt.value ?? undefined);
                  const href = buildHref(region, danceType, opt.value, keyword, periodFrom, periodTo);
                  return (
                    <Link
                      key={opt.label}
                      href={href}
                      className={`shrink-0 rounded-full border px-3 py-1 text-sm transition-colors whitespace-nowrap ${
                        active
                          ? 'border-slate-600 bg-slate-600 text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {opt.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-gray-50 pt-3">
              <span className="text-xs font-bold text-gray-400 w-8 shrink-0 whitespace-nowrap">키워드</span>
              <div className="flex flex-1 min-w-0 gap-2">
                <input
                  type="text"
                  name="keyword"
                  defaultValue={keyword}
                  placeholder="해시태그·키워드 검색"
                  className="flex-1 min-w-0 rounded-full border border-gray-200 px-3 py-1.5 text-sm placeholder:text-gray-400 focus:border-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-slate-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
                >
                  검색
                </button>
              </div>
            </div>
          </form>
        </FilterSection>
      </header>

      {/* 갤러리 그리드 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {posts.map((post) => {
          const thumbnail = post.images[0];
          const regionLabel = post.region
            ? post.region.split(',').map((r) => r.trim()).filter(Boolean).map((r) => regionLabelMap[r] || r).join(' · ')
            : undefined;
          const danceTypeLabel =
            post.danceType === 'SALSA'
              ? '살사'
              : post.danceType === 'BACHATA'
              ? '바차타'
              : post.danceType === 'KIZOMBA'
              ? '키좀바'
              : post.danceType === 'ZOUK'
              ? '주크'
              : post.danceType === 'ETC'
              ? '기타'
              : undefined;

          return (
            <Link
              key={post.id.toString()}
              href={`/posts/${post.id}`}
              className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg border border-gray-100"
            >
              {/* 대표 이미지 (4:5 비율) - Next/Image로 최적화·지연 로딩 */}
              <div
                className="relative w-full overflow-hidden bg-gray-100"
                style={{ aspectRatio: '4 / 5' }}
              >
                {thumbnail ? (
                  <Image
                    src={thumbnail.imageUrl}
                    alt={post.title || '수업 이미지'}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                    이미지 없음
                  </div>
                )}

                {/* 상단 라벨 */}
                <div className="absolute left-2 top-2 flex gap-2 text-xs">
                  {regionLabel && (
                    <span className="rounded-full bg-black/60 px-2 py-1 text-white backdrop-blur-sm">
                      {regionLabel}
                    </span>
                  )}
                  {danceTypeLabel && (
                    <span className="rounded-full bg-slate-600/80 px-2 py-1 text-white backdrop-blur-sm">
                      {danceTypeLabel}
                    </span>
                  )}
                </div>
                {/* 관리자만: 이미지 우측 하단 조회수 (인스타그램 스타일) */}
                {adminSession && (
                  <div className="absolute right-2 bottom-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white/95 backdrop-blur-sm">
                    조회 {(post as { viewCount?: number }).viewCount ?? 0}
                  </div>
                )}
              </div>

              {/* 카드 하단 정보 */}
              <div className="flex flex-1 flex-col px-3 py-3">
                <h2 className="line-clamp-1 text-sm font-semibold text-gray-900">
                  {post.title || '제목 없음'}
                </h2>
                {formatKeywords((post as any).keywords) && (
                  <p className="mt-1 text-xs text-gray-600 flex items-center justify-between">
                    <span>{formatKeywords((post as any).keywords)}</span>
                    {(post as any).classDays && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {(post as any).classDays.split(',').map((d: string) => dayMap[d]).join('·')}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {posts.length === 0 && (
        <div className="mt-16 text-center text-gray-500 bg-white py-20 rounded-xl border border-dashed border-gray-200">
          조건에 맞는 수업이 없습니다.
        </div>
      )}
    </div>
  );
}
