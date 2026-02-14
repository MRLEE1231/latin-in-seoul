import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deletePost } from '@/app/admin/actions';
import { revalidatePath } from 'next/cache';

/**
 * 스케줄러 전용 API: 종료일(endDate)이 오늘(00:00 KST) 이전인 수업 게시글을 삭제합니다.
 * 하루 한 번 00:00 KST에 서버 cron으로 호출하는 용도입니다.
 *
 * 인증: Authorization: Bearer <CRON_SECRET> (환경 변수 CRON_SECRET과 일치해야 함)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 오늘 00:00 KST
    const kstDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
    const todayStartKST = new Date(`${kstDateStr}T00:00:00+09:00`);

    const expired = await prisma.post.findMany({
      where: {
        endDate: { not: null, lt: todayStartKST },
      },
      select: { id: true },
    });

    let deleted = 0;
    for (const post of expired) {
      await deletePost(post.id, { skipRevalidate: true });
      deleted += 1;
    }

    if (deleted > 0) {
      revalidatePath('/posts');
      revalidatePath('/admin');
    }

    return NextResponse.json({
      ok: true,
      deleted,
      cutoff: todayStartKST.toISOString(),
    });
  } catch (err) {
    console.error('cron cleanup-expired error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Cleanup failed' },
      { status: 500 }
    );
  }
}
