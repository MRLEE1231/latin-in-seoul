/**
 * SQLite DB 데이터를 현재 DATABASE_URL(PostgreSQL)로 복사합니다.
 * 사용: SQLITE_DB_PATH=./prisma/dev.db node prisma/migrate-sqlite-to-pg.mjs
 * 또는: node prisma/migrate-sqlite-to-pg.mjs ./path/to/dev.db
 *
 * - 로컬: SQLite 파일 경로 + .env의 DATABASE_URL을 PostgreSQL로 두고 실행
 * - 서버: 서버의 data/prisma/dev.db 경로 + DATABASE_URL=postgresql://... 로 실행
 */

import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';

const sqlitePath = process.env.SQLITE_DB_PATH || process.argv[2];
if (!sqlitePath) {
  console.error('Usage: SQLITE_DB_PATH=./prisma/dev.db node prisma/migrate-sqlite-to-pg.mjs');
  console.error('   or: node prisma/migrate-sqlite-to-pg.mjs ./path/to/dev.db');
  process.exit(1);
}

const prisma = new PrismaClient();

function parseDate(v) {
  if (v == null) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

async function main() {
  const sqlite = new Database(sqlitePath, { readonly: true });

  const users = sqlite.prepare('SELECT * FROM users').all();
  const posts = sqlite.prepare('SELECT * FROM posts').all();
  const postImages = sqlite.prepare('SELECT * FROM post_images').all();

  console.log(`SQLite: users=${users.length}, posts=${posts.length}, post_images=${postImages.length}`);

  if (users.length > 0) {
    const data = users.map((r) => ({
      id: r.id,
      username: r.username,
      passwordHash: r.passwordHash,
      role: r.role,
      createdAt: parseDate(r.createdAt) ?? new Date(),
    }));
    await prisma.user.createMany({ data, skipDuplicates: true });
    console.log('Users copied.');
  }

  if (posts.length > 0) {
    const data = posts.map((r) => ({
      id: r.id,
      title: r.title ?? undefined,
      content: r.content ?? '',
      region: r.region ?? undefined,
      danceType: r.danceType ?? undefined,
      instructorName: r.instructorName ?? undefined,
      classDays: r.classDays ?? undefined,
      startDate: parseDate(r.startDate),
      endDate: parseDate(r.endDate),
      keywords: r.keywords ?? undefined,
      classDescription: r.classDescription ?? undefined,
      createdAt: parseDate(r.createdAt) ?? new Date(),
      updatedAt: parseDate(r.updatedAt) ?? new Date(),
    }));
    await prisma.post.createMany({ data, skipDuplicates: true });
    console.log('Posts copied.');
  }

  if (postImages.length > 0) {
    const data = postImages.map((r) => ({
      id: r.id,
      postId: r.postId,
      imageUrl: r.imageUrl,
      imageOrder: r.imageOrder ?? 0,
      createdAt: parseDate(r.createdAt) ?? new Date(),
    }));
    await prisma.postImage.createMany({ data, skipDuplicates: true });
    console.log('Post_images copied.');
  }

  // 시퀀스 맞춤 (다음 INSERT 시 id 충돌 방지)
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1))`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('posts', 'id'), COALESCE((SELECT MAX(id) FROM posts), 1))`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('post_images', 'id'), COALESCE((SELECT MAX(id) FROM post_images), 1))`);
  console.log('Sequences updated.');

  sqlite.close();
  console.log('Done.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
