'use client';

import { useState, Children, cloneElement, isValidElement, ReactElement } from 'react';

const DETAILED_MARKER = 'detailed-only';

export default function FilterSection({
  children,
  initialDetailed = false,
  leftExtra,
}: {
  children: React.ReactNode;
  initialDetailed?: boolean;
  leftExtra?: React.ReactNode;
}) {
  const [isDetailed, setIsDetailed] = useState(initialDetailed);

  const arrayChildren = Children.toArray(children);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-h-[28px] flex items-center">
          {leftExtra}
        </div>
        <button
          type="button"
          onClick={() => setIsDetailed((prev) => !prev)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all border ${
            isDetailed
              ? 'bg-slate-600 text-white border-slate-600 shadow-sm'
              : 'bg-white text-gray-400 border-gray-200 hover:text-gray-600 hover:border-gray-300'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          상세 검색
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
        {arrayChildren.map((child, index) => {
          if (!isValidElement(child)) return child;
          const el = child as ReactElement<{ className?: string }>;
          const isDetailedBlock = el.props?.className?.includes(DETAILED_MARKER);
          if (isDetailedBlock && !isDetailed) return null;
          if (isDetailedBlock && isDetailed) {
            const className = (el.props.className || '').replace(/\bhidden\b/g, 'flex').trim();
            return cloneElement(el, { key: index, className });
          }
          return cloneElement(el, { key: index });
        })}
      </div>
    </div>
  );
}
