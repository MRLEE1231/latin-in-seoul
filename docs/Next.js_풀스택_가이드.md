# Next.js 풀스택 가이드

## Next.js = 프론트엔드 + 백엔드 통합

Next.js는 **하나의 프로젝트**에서 프론트엔드와 백엔드를 모두 처리할 수 있습니다.

---

## 프로젝트 구조

```
latin-in-seoul/
├── app/
│   ├── page.tsx                    # 프론트: 홈페이지 (게시판 목록)
│   ├── posts/
│   │   ├── page.tsx                # 프론트: 게시글 목록 페이지
│   │   └── [id]/
│   │       └── page.tsx            # 프론트: 게시글 상세 페이지
│   └── api/                        # 백엔드: API 엔드포인트
│       └── posts/
│           ├── route.ts            # 백엔드: GET/POST /api/posts
│           └── [id]/
│               └── route.ts        # 백엔드: GET/PUT/DELETE /api/posts/:id
├── components/                     # 프론트: 재사용 컴포넌트
├── lib/                            # 공통 유틸리티
│   └── prisma.ts                   # 데이터베이스 클라이언트
├── prisma/
│   └── schema.prisma               # 데이터베이스 스키마
└── package.json
```

---

## 프론트엔드 (React 컴포넌트)

### 게시판 목록 페이지
```typescript
// app/posts/page.tsx
export default async function PostsPage() {
  // 서버 컴포넌트에서 직접 데이터베이스 접근 가능!
  const posts = await prisma.post.findMany({
    include: { images: true }
  });

  return (
    <div>
      <h1>수업 게시판</h1>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

### 게시글 상세 페이지
```typescript
// app/posts/[id]/page.tsx
export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const post = await prisma.post.findUnique({
    where: { id: parseInt(params.id) },
    include: { images: true }
  });

  return (
    <div>
      <h1>{post.title}</h1>
      <p>지역: {post.region}</p>
      <p>종류: {post.danceType}</p>
      <p>강사: {post.instructorName}</p>
      <div>{post.content}</div>
      {/* 이미지 갤러리 */}
    </div>
  );
}
```

---

## 백엔드 (API Routes)

### 게시글 목록/생성 API
```typescript
// app/api/posts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/posts - 목록 조회
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const region = searchParams.get('region');
  const danceType = searchParams.get('danceType');

  const posts = await prisma.post.findMany({
    where: {
      ...(region && { region }),
      ...(danceType && { danceType })
    },
    include: { images: true },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(posts);
}

// POST /api/posts - 게시글 생성
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const post = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
      region: body.region,
      danceType: body.danceType,
      instructorName: body.instructorName,
      classDescription: body.classDescription,
      images: {
        create: body.images.map((url: string, index: number) => ({
          imageUrl: url,
          imageOrder: index
        }))
      }
    },
    include: { images: true }
  });

  return NextResponse.json(post, { status: 201 });
}
```

### 게시글 상세/수정/삭제 API
```typescript
// app/api/posts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/posts/:id - 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = await prisma.post.findUnique({
    where: { id: parseInt(params.id) },
    include: { images: true }
  });

  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(post);
}

// PUT /api/posts/:id - 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  
  const post = await prisma.post.update({
    where: { id: parseInt(params.id) },
    data: body
  });

  return NextResponse.json(post);
}

// DELETE /api/posts/:id - 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.post.delete({
    where: { id: parseInt(params.id) }
  });

  return NextResponse.json({ message: 'Deleted' });
}
```

---

## 데이터베이스 연결 (Prisma)

### Prisma 스키마
```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id               BigInt      @id @default(autoincrement())
  title            String?
  content          String
  region           String?     // 'GANGNAM', 'HONGDAE', 'ETC'
  danceType        String?     // 'SALSA', 'BACHATA', 'KIZOMBA'
  instructorName   String?
  classDescription String?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  images           PostImage[]

  @@map("posts")
}

model PostImage {
  id        BigInt   @id @default(autoincrement())
  postId    BigInt
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  imageUrl  String
  imageOrder Int     @default(0)
  createdAt DateTime @default(now())

  @@map("post_images")
}
```

### Prisma 클라이언트 설정
```typescript
// lib/prisma.ts

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

## 이미지 업로드 처리

### 이미지 업로드 API
```typescript
// app/api/posts/[id]/images/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const formData = await request.formData();
  const files = formData.getAll('images') as File[];

  const uploadedUrls: string[] = [];

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 파일 저장 (로컬 또는 S3)
    const filename = `${Date.now()}-${file.name}`;
    const path = join(process.cwd(), 'public', 'uploads', filename);
    await writeFile(path, buffer);

    uploadedUrls.push(`/uploads/${filename}`);
  }

  // 데이터베이스에 이미지 정보 저장
  await prisma.postImage.createMany({
    data: uploadedUrls.map((url, index) => ({
      postId: parseInt(params.id),
      imageUrl: url,
      imageOrder: index
    }))
  });

  return NextResponse.json({ urls: uploadedUrls });
}
```

---

## Spring Boot와 비교

| 기능 | Spring Boot | Next.js |
|------|-------------|---------|
| **프론트엔드** | Thymeleaf (서버 렌더링) | React (SSR/SSG/CSR) |
| **백엔드 API** | `@RestController` | `app/api/**/route.ts` |
| **데이터베이스** | Spring Data JPA | Prisma ORM |
| **라우팅** | `@RequestMapping` | 파일 기반 자동 라우팅 |
| **의존성 주입** | `@Autowired` | 직접 import |
| **설정 파일** | `application.properties` | `.env` |

---

## 장점 요약

### ✅ 단일 프로젝트 관리
- 프론트/백 코드가 같은 프로젝트에 있어 관리 용이
- 타입 공유 가능 (TypeScript)
- 배포 단순화

### ✅ 서버 컴포넌트
- 데이터베이스 직접 접근 가능 (API 없이도)
- SEO 최적화 자동
- 빠른 초기 로딩

### ✅ API Routes
- RESTful API 쉽게 구현
- Express.js와 유사한 패턴
- 백엔드 개발자에게 친숙

### ✅ 자동 최적화
- 이미지 최적화 (`next/image`)
- 코드 스플리팅 자동
- 번들 크기 최적화

---

## 배포

### Vercel 배포 (무료)
```bash
# 1. GitHub에 푸시
git push origin main

# 2. Vercel에 연결
# - vercel.com 접속
# - GitHub 저장소 연결
# - 자동 배포 완료!

# 환경 변수 설정 (.env)
DATABASE_URL="postgresql://..."
```

### 단일 배포
- 프론트엔드와 백엔드가 함께 배포됨
- 별도 서버 설정 불필요
- Vercel이 자동으로 처리

---

## 결론

**Next.js = 프론트엔드 + 백엔드 통합 프레임워크**

- ✅ 프론트엔드: React 컴포넌트로 UI 구성
- ✅ 백엔드: API Routes로 서버 로직 처리
- ✅ 데이터베이스: Prisma로 ORM 사용
- ✅ 단일 프로젝트: 모든 것이 하나의 코드베이스

**Spring Boot를 사용하지 않아도** Next.js만으로 완전한 웹 애플리케이션을 구축할 수 있습니다!

---

*작성일: 2025-02-12 | Next.js 풀스택 가이드*
