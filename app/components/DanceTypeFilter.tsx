'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Option {
  label: string;
  value?: string;
}

export default function DanceTypeFilter({ 
  options, 
  currentDanceType, 
  region,
  day,
  keyword
}: { 
  options: Option[]; 
  currentDanceType?: string;
  region?: string;
  day?: string;
  keyword?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const firstChild = container.firstElementChild as HTMLElement;
        if (firstChild) {
          const lineHeight = firstChild.offsetHeight;
          const isOverflowing = container.scrollHeight > lineHeight + 4;
          setShowButton(isOverflowing);
        }
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    checkOverflow();

    return () => resizeObserver.disconnect();
  }, [options]);

  const buildHref = (danceType?: string) => {
    const params = new URLSearchParams();
    if (region) params.set('region', region);
    if (danceType) params.set('danceType', danceType);
    if (day) params.set('day', day);
    if (keyword) params.set('keyword', keyword);
    const qs = params.toString();
    return qs ? `/posts?${qs}` : '/posts';
  };

  return (
    <div className="flex items-start gap-2 flex-1 min-w-0">
      <div 
        ref={containerRef}
        className={`flex flex-wrap gap-2 transition-all duration-300 ease-in-out overflow-hidden ${
          !isExpanded ? 'max-h-[32px]' : 'max-h-[500px]'
        }`}
      >
        {options.map((opt) => {
          const active = currentDanceType === (opt.value ?? undefined);
          return (
            <Link
              key={opt.label}
              href={buildHref(opt.value)}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm transition-colors ${
                active
                  ? 'border-slate-600 bg-slate-600 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-slate-400 hover:text-slate-600'
              }`}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>
      
      {showButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 hover:border-slate-400 hover:text-slate-600 transition-colors shadow-sm"
          aria-label={isExpanded ? "접기" : "펼치기"}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
      )}
    </div>
  );
}
