'use client';

import { useEffect } from 'react';

/** 사이트 로드 시 한 번 /api/visit 호출 (당일 1회 방문으로 카운트). */
export default function VisitRecorder() {
  useEffect(() => {
    fetch('/api/visit', { method: 'GET', credentials: 'same-origin' }).catch(() => {});
  }, []);
  return null;
}
