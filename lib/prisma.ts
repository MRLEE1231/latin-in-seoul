import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 런타임 DATABASE_URL을 명시적으로 전달 → 빌드 시 인라인된 값에 의존하지 않음 (재시작/배포 후 P1000 방지)
function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url && process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is required in production');
  }
  return new PrismaClient(
    url ? { datasources: { db: { url } } } : undefined
  );
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
