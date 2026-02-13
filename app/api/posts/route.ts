import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/posts - 게시글 목록 조회 (필터링 지원)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get('region'); // 'GANGNAM', 'HONGDAE', 'ETC'
    const danceType = searchParams.get('danceType'); // 'SALSA', 'BACHATA', 'KIZOMBA'

    const posts = await prisma.post.findMany({
      where: {
        ...(region && { region }),
        ...(danceType && { danceType }),
      },
      include: {
        images: {
          orderBy: { imageOrder: 'asc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST /api/posts - 게시글 생성 (관리자용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      region,
      danceType,
      instructorName,
      classDescription,
      images = [],
    } = body;

    // 필수 필드 검증
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        region,
        danceType,
        instructorName,
        classDescription,
        images: {
          create: images.map((url: string, index: number) => ({
            imageUrl: url,
            imageOrder: index,
          })),
        },
      },
      include: {
        images: {
          orderBy: { imageOrder: 'asc' },
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
