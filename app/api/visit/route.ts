import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const COOKIE_NAME = 'visit_date';

/** 오늘 날짜 문자열 (KST) YYYY-MM-DD */
function getTodayKST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

/**
 * 방문 기록 (당일 1회만 카운트, 쿠키로 구분).
 * GET 요청 시 쿠키가 없거나 다른 날짜면 오늘 카운트 +1 후 쿠키 설정.
 */
export async function GET(request: NextRequest) {
  const today = getTodayKST();
  const cookieValue = request.cookies.get(COOKIE_NAME)?.value;

  if (cookieValue === today) {
    return new NextResponse(null, { status: 204 });
  }

  const todayDate = new Date(`${today}T00:00:00.000Z`);

  await prisma.dailyVisit.upsert({
    where: { date: todayDate },
    create: { date: todayDate, count: 1 },
    update: { count: { increment: 1 } },
  });

  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(COOKIE_NAME, today, {
    path: '/',
    maxAge: 60 * 60 * 24, // 24h
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });

  return res;
}
