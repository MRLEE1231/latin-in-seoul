'use server';

import { prisma } from '@/lib/prisma';
import { verifyPassword, setAdminSession, clearAdminSession } from '@/lib/auth';

export type LoginResult = { success: true } | { success: false; error: string };

export async function login(formData: FormData): Promise<LoginResult> {
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { success: false, error: '아이디와 비밀번호를 입력하세요.' };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
  }

  if (user.role !== 'ADMIN') {
    return { success: false, error: '권한이 없습니다.' };
  }

  await setAdminSession(user.username, user.role);
  return { success: true };
}

export async function logout(): Promise<void> {
  await clearAdminSession();
}
