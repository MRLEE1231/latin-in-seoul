'use client';

import { useRef, useEffect, useState } from 'react';

export type DailyVisitItem = { date: string; count: number };

const BAR_WIDTH = 44;
const GAP = 4;
const BAR_AREA_HEIGHT = 120; // 막대가 그려질 영역 높이(px). % 대신 px 사용해 높이가 0이 되지 않도록 함

/** YYYY-MM-DD → M/D (예: 2/16) */
function formatShort(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  return `${m}/${d}`;
}

export default function DailyVisitsChart({ data }: { data: DailyVisitItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  // 최초 로드 시 오늘(마지막 막대)이 차트 가운데 오도록 스크롤
  useEffect(() => {
    if (data.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;
    const todayIndex = data.length - 1;
    const todayCenter = todayIndex * (BAR_WIDTH + GAP) + BAR_WIDTH / 2;
    const viewportCenter = el.clientWidth / 2;
    const scrollLeft = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, todayCenter - viewportCenter));
    el.scrollLeft = scrollLeft;
  }, [data.length]);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-slate-600 dark:bg-slate-800/80">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 dark:text-slate-200">일별 방문자 수</h3>
      <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden pb-2 -mx-1 px-1" style={{ scrollbarGutter: 'stable' }}>
        <div className="flex items-end gap-1 min-h-40" style={{ minWidth: 'min-content', width: data.length ? data.length * BAR_WIDTH + (data.length - 1) * GAP : 'auto' }}>
          {data.length === 0 ? (
            <p className="text-sm text-gray-400 self-center py-8 dark:text-slate-400">데이터 없음</p>
          ) : (
            data.map((d) => {
              const isSelected = selectedDate === d.date;
              const barHeight = Math.max(6, Math.round((d.count / maxCount) * BAR_AREA_HEIGHT));
              return (
                <div key={d.date} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: BAR_WIDTH }}>
                  <div className="min-h-[18px] text-xs font-semibold text-slate-600 text-center dark:text-slate-300">
                    {isSelected ? `${d.count}명` : '\u00A0'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(isSelected ? null : d.date)}
                    className="w-8 rounded-t bg-slate-500 hover:bg-slate-600 transition-colors flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 dark:bg-slate-400 dark:hover:bg-slate-300 dark:focus:ring-slate-500 dark:focus:ring-offset-slate-800"
                    style={{ height: `${barHeight}px` }}
                    title={`${d.date}: ${d.count}명`}
                  />
                  <span className="text-[10px] text-gray-500 text-center whitespace-nowrap dark:text-slate-400" title={d.date}>
                    {formatShort(d.date)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2 dark:text-slate-500">최근 30일, 가로 스크롤로 일자 이동 · 당일 1회 쿠키 기준</p>
    </div>
  );
}
