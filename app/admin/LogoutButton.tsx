'use client';

import { useRouter } from 'next/navigation';
import { logout } from './auth-actions';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.refresh();
    router.push('/');
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-600 dark:hover:text-white"
    >
      로그아웃
    </button>
  );
}
