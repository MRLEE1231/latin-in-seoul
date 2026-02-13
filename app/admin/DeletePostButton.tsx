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
      className="text-red-500 hover:text-red-700 font-medium transition-colors"
    >
      삭제
    </button>
  );
}
