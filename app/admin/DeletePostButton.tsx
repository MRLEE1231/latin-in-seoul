'use client';

import { deletePost } from './actions';

export default function DeletePostButton({ id }: { id: number }) {
  return (
    <button
      onClick={async () => {
        if (confirm('정말로 이 수업을 삭제하시겠습니까?')) {
          await deletePost(id);
        }
      }}
      className="whitespace-nowrap rounded-md border border-red-200 px-2 py-1 text-[11px] font-medium text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs"
    >
      삭제
    </button>
  );
}
