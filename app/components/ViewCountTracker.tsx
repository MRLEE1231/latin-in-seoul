'use client';

import { useEffect } from 'react';

/** 상세 페이지 마운트 시 조회수 +1 (인스타그램처럼 1회 증가) */
export default function ViewCountTracker({ postId }: { postId: number }) {
  useEffect(() => {
    fetch(`/api/posts/${postId}/view`, { method: 'POST', credentials: 'same-origin' }).catch(() => {});
  }, [postId]);
  return null;
}
