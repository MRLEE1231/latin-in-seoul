#!/usr/bin/env node
/**
 * 서버의 수업 이미지(uploads) 중 5MB 초과 파일을 5MB 이하로 압축.
 * 확장자가 .jpg로 바뀌면 DB(post_images)의 imageUrl도 갱신함.
 *
 * 사용: node scripts/compress-uploaded-images.mjs [디렉터리]
 * 예: docker exec latin-app node /app/scripts/compress-uploaded-images.mjs /app/public/uploads
 */

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const MAX_BYTES = 5 * 1024 * 1024;
const DIR = process.argv[2] || path.join(process.cwd(), 'public', 'uploads');

async function compressBuffer(buffer, ext) {
  if (buffer.length <= MAX_BYTES) return { buffer, ext };
  const maxSide = 2560;
  let quality = 85;
  for (;;) {
    const out = await sharp(buffer)
      .resize(maxSide, maxSide, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    if (out.length <= MAX_BYTES || quality <= 50) return { buffer: out, ext: '.jpg' };
    quality -= 10;
  }
}

async function main() {
  const dir = path.resolve(DIR);
  try {
    await fs.access(dir);
  } catch {
    console.error('디렉터리를 찾을 수 없습니다:', dir);
    process.exit(1);
  }

  const names = await fs.readdir(dir);
  let updated = 0;
  let dbUpdates = [];

  for (const name of names) {
    const filePath = path.join(dir, name);
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) continue;
    if (stat.size <= MAX_BYTES) continue;

    const ext = path.extname(name).toLowerCase();
    const base = path.basename(name, ext);
    const buffer = await fs.readFile(filePath);
    const { buffer: out, ext: newExt } = await compressBuffer(buffer, ext);

    const newName = base + newExt;
    const newPath = path.join(dir, newName);

    if (newExt !== ext) {
      await fs.writeFile(newPath, out);
      await fs.unlink(filePath);
      const oldUrl = '/uploads/' + name;
      const newUrl = '/uploads/' + newName;
      dbUpdates.push({ oldUrl, newUrl });
    } else {
      await fs.writeFile(filePath, out);
    }
    updated++;
    console.log(name, (stat.size / 1024 / 1024).toFixed(2), 'MB ->', (out.length / 1024 / 1024).toFixed(2), 'MB');
  }

  if (dbUpdates.length > 0) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      for (const { oldUrl, newUrl } of dbUpdates) {
        await prisma.postImage.updateMany({ where: { imageUrl: oldUrl }, data: { imageUrl: newUrl } });
      }
      await prisma.$disconnect();
      console.log('DB post_images imageUrl', dbUpdates.length, '건 갱신됨');
    } catch (e) {
      console.error('DB 갱신 실패 (수동으로 post_images.image_url 변경 필요):', e.message);
    }
  }

  console.log('총', updated, '개 파일 압축 완료');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
