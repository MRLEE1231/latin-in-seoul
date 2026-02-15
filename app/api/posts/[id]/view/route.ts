import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** POST /api/posts/:id/view - 상세 페이지 조회 시 1회 호출해 조회수 +1 (인스타그램처럼 노출당 1회) */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }
    await prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('view count increment error:', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
