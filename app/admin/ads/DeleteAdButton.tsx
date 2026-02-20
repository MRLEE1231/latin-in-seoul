'use client';

import { useRouter } from 'next/navigation';
import { deleteHomeAd } from './actions';

export default function DeleteAdButton({ id }: { id: number }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        if (confirm('이 광고를 삭제하시겠습니까?')) {
          await deleteHomeAd(id);
          router.refresh();
        }
      }}
      className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
    >
      삭제
    </button>
  );
}
