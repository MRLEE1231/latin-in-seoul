import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DeletePostButton from './DeletePostButton';
import LogoutButton from './LogoutButton';

export default async function AdminPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">관리자 페이지</h1>
          <p className="text-gray-500 text-sm mt-1">수업 목록 관리 및 신규 등록</p>
        </div>
        <div className="flex items-center gap-2">
          <LogoutButton />
          <Link
            href="/admin/posts/new"
            className="rounded-xl bg-slate-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-slate-700 transition-all"
          >
            + 새 수업 등록
          </Link>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
              <tr>
                <th className="px-6 py-4">제목</th>
                <th className="px-6 py-4">등록일시</th>
                <th className="px-6 py-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-400">
                    등록된 수업이 없습니다.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <Link href={`/posts/${post.id}`} className="hover:text-slate-600">
                        {post.title || '제목 없음'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(post.createdAt).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          수정
                        </Link>
                        <DeletePostButton id={post.id} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/posts" className="text-sm text-gray-400 hover:text-gray-600 underline">
          일반 사용자 페이지로 이동
        </Link>
      </div>
    </div>
  );
}
