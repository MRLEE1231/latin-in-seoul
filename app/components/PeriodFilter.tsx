'use client';

import { useRouter } from 'next/navigation';

function buildPostsHref(params: {
  region?: string;
  danceType?: string;
  day?: string;
  keyword?: string;
  periodFrom?: string;
  periodTo?: string;
}) {
  const search = new URLSearchParams();
  if (params.region) search.set('region', params.region);
  if (params.danceType) search.set('danceType', params.danceType);
  if (params.day) search.set('day', params.day);
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.periodFrom) search.set('periodFrom', params.periodFrom);
  if (params.periodTo) search.set('periodTo', params.periodTo);
  const qs = search.toString();
  return qs ? `/posts?${qs}` : '/posts';
}

export default function PeriodFilter({
  region,
  danceType,
  day,
  keyword,
  periodFrom,
  periodTo,
}: {
  region?: string;
  danceType?: string;
  day?: string;
  keyword?: string;
  periodFrom?: string;
  periodTo?: string;
}) {
  const router = useRouter();

  const navigate = (newPeriodFrom: string, newPeriodTo: string) => {
    const href = buildPostsHref({
      region,
      danceType,
      day,
      keyword,
      periodFrom: newPeriodFrom || undefined,
      periodTo: newPeriodTo || undefined,
    });
    router.push(href);
  };

  return (
    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto min-w-0 py-1">
      <span className="text-xs font-bold text-gray-400 w-8 shrink-0 whitespace-nowrap">기간</span>
      <input
        type="date"
        value={periodFrom ?? ''}
        onChange={(e) => navigate(e.target.value, periodTo ?? '')}
        className="shrink-0 rounded-full border border-gray-200 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none min-w-[8.5rem]"
      />
      <span className="text-xs text-gray-400 shrink-0">~</span>
      <input
        type="date"
        value={periodTo ?? ''}
        onChange={(e) => navigate(periodFrom ?? '', e.target.value)}
        className="shrink-0 rounded-full border border-gray-200 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none min-w-[8.5rem]"
      />
    </div>
  );
}
