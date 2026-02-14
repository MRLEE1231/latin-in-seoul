# Latin in Seoul

서울의 라틴 댄스 수업 정보를 소개하는 웹 애플리케이션입니다.

## 기술 스택 (무료)

- **프론트엔드 + 백엔드**: Next.js 14+ (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **데이터베이스**: PostgreSQL (Supabase 무료 티어)
- **ORM**: Prisma
- **배포**: Vercel (무료 티어)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 데이터베이스 설정 (PostgreSQL)

프로젝트는 **PostgreSQL**을 사용합니다. 로컬에서는 Docker로 띄우거나, Supabase 등 원격 DB를 쓸 수 있습니다.

#### 로컬 PostgreSQL (Docker)

```bash
cp .env.example .env
# .env의 DATABASE_URL이 postgresql://postgres:postgres@localhost:5432/latin_in_seoul 인지 확인

docker compose up -d postgres
npx prisma migrate deploy
npx prisma db seed   # 또는 node prisma/seed.mjs (관리자 계정 생성)
```

#### Supabase 무료 티어

1. [Supabase](https://supabase.com)에서 프로젝트 생성 후 Connection string(URI) 복사
2. `.env`에 `DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"` 설정
3. `npx prisma migrate deploy` 실행

### 3. 데이터베이스 마이그레이션

```bash
npx prisma generate
npx prisma migrate deploy   # 운영/로컬 DB에 스키마 적용
# 또는 개발 시: npx prisma migrate dev --name 변경이름
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
latin_in_seoul/
├── app/
│   ├── api/
│   │   └── posts/          # 게시글 API 엔드포인트
│   ├── posts/              # 게시판 페이지
│   ├── layout.tsx          # 레이아웃
│   └── page.tsx            # 홈페이지
├── lib/
│   └── prisma.ts           # Prisma 클라이언트 설정
├── prisma/
│   └── schema.prisma       # 데이터베이스 스키마
└── public/                 # 정적 파일
```

## API 엔드포인트

- `GET /api/posts` - 게시글 목록 조회 (필터링: `?region=GANGNAM&danceType=SALSA`)
- `GET /api/posts/:id` - 게시글 상세 조회
- `POST /api/posts` - 게시글 생성
- `PUT /api/posts/:id` - 게시글 수정
- `DELETE /api/posts/:id` - 게시글 삭제

## 데이터 모델

### Post (게시글)
- `id`: 게시글 ID
- `title`: 제목 (선택)
- `content`: 본문 텍스트 (필수)
- `region`: 지역 ('GANGNAM', 'HONGDAE', 'ETC')
- `danceType`: 종류 ('SALSA', 'BACHATA', 'KIZOMBA')
- `instructorName`: 강사명
- `classDescription`: 수업설명
- `createdAt`: 작성일자
- `updatedAt`: 수정일자
- `images`: 이미지 목록

### PostImage (이미지)
- `id`: 이미지 ID
- `postId`: 게시글 ID
- `imageUrl`: 이미지 URL
- `imageOrder`: 이미지 순서
- `createdAt`: 생성일자

## 배포

### Vercel 배포 (무료)

1. GitHub에 프로젝트 푸시
2. [Vercel](https://vercel.com)에 로그인
3. New Project > GitHub 저장소 연결
4. Environment Variables에 `DATABASE_URL` 추가
5. Deploy

자동으로 배포되며, 이후 Git 푸시 시 자동 재배포됩니다.

## 개발 가이드

### Prisma 스튜디오 (데이터베이스 GUI)

```bash
npx prisma studio
```

브라우저에서 데이터베이스를 시각적으로 관리할 수 있습니다.

### 데이터베이스 마이그레이션

```bash
# 개발 환경
npx prisma migrate dev

# 프로덕션 환경
npx prisma migrate deploy
```

## 비용

**초기 비용: $0/월** 💰

- Next.js: 무료 (오픈소스)
- Prisma: 무료 (오픈소스)
- Supabase: 무료 티어 (500MB 저장공간)
- Vercel: 무료 티어 (100GB/월 대역폭)

## 라이선스

MIT
