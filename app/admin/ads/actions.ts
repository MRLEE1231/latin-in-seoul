'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { compressIfNeeded } from '@/lib/image-compress';

const ADS_UPLOAD_DIR = path.join(process.cwd(), 'public', 'ads');

async function saveAdImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  let buffer = Buffer.from(bytes);
  let ext = path.extname(file.name).toLowerCase() || '.jpg';

  const compressed = await compressIfNeeded(buffer, ext);
  buffer = compressed.buffer;
  ext = compressed.ext;

  const fileName = `${uuidv4()}${ext}`;
  const relativePath = `/ads/${fileName}`;
  const absolutePath = path.join(ADS_UPLOAD_DIR, fileName);
  await mkdir(ADS_UPLOAD_DIR, { recursive: true });
  await writeFile(absolutePath, buffer);
  return relativePath;
}

export type CreateHomeAdResult = { success: true } | { success: false; error: string };

export type PostSearchItem = { id: number; title: string | null; firstImageUrl: string | null };

export async function searchPostsForAd(query: string): Promise<PostSearchItem[]> {
  const q = (query ?? '').trim();
  const posts = await prisma.post.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
            { instructorName: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true,
      title: true,
      images: { orderBy: { imageOrder: 'asc' }, take: 1, select: { imageUrl: true } },
    },
  });
  return posts.map((p) => ({
    id: p.id,
    title: p.title ?? '(제목 없음)',
    firstImageUrl: p.images[0]?.imageUrl ?? null,
  }));
}

async function getImageAndHrefFromPostId(postId: number): Promise<{ image: string; href: string }> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { images: { orderBy: { imageOrder: 'asc' }, take: 1 } },
  });
  if (!post) throw new Error('선택한 수업을 찾을 수 없습니다.');
  const image = post.images[0]?.imageUrl ?? '';
  if (!image) throw new Error('해당 수업에 등록된 이미지가 없습니다.');
  return { image, href: `/posts/${postId}` };
}

export async function createHomeAd(formData: FormData): Promise<CreateHomeAdResult> {
  try {
    const kind = ((formData.get('kind') as string) ?? 'ETC').toUpperCase() === 'CLASS' ? 'CLASS' : 'ETC';
    const title = (formData.get('title') as string)?.trim() ?? '';
    const description = (formData.get('description') as string)?.trim() ?? '';
    const orderRaw = formData.get('order');
    const order = orderRaw !== null && orderRaw !== '' ? parseInt(String(orderRaw), 10) : 0;
    const safeOrder = isNaN(order) ? 0 : order;

    let image: string;
    let href: string;
    let postId: number | null = null;

    if (kind === 'CLASS') {
      const postIdRaw = formData.get('postId');
      const pid = postIdRaw !== null && postIdRaw !== '' ? parseInt(String(postIdRaw), 10) : NaN;
      if (!pid || isNaN(pid)) return { success: false, error: '수업을 선택해 주세요.' };
      const resolved = await getImageAndHrefFromPostId(pid);
      image = resolved.image;
      href = resolved.href;
      postId = pid;
    } else {
      const imageFile = formData.get('image');
      if (!(imageFile instanceof File) || imageFile.size === 0) {
        return { success: false, error: '이미지 파일을 선택해 주세요.' };
      }
      image = await saveAdImage(imageFile);
      href = (formData.get('href') as string)?.trim() ?? '';
      if (!href) return { success: false, error: '링크를 입력해 주세요.' };
    }

    if (!title) return { success: false, error: '제목은 필수입니다.' };

    await prisma.homeAd.create({
      data: {
        kind,
        postId,
        image,
        title,
        description,
        href,
        order: safeOrder,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/admin/ads');
    redirect('/admin/ads');
  } catch (err) {
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;
    console.error('createHomeAd error:', err);
    const message = err instanceof Error ? err.message : '광고 등록 중 오류가 발생했습니다.';
    return { success: false, error: message };
  }
}

export async function updateHomeAd(formData: FormData): Promise<CreateHomeAdResult> {
  const id = Number(formData.get('id'));
  if (!id || isNaN(id)) return { success: false, error: '잘못된 광고 ID입니다.' };

  const ad = await prisma.homeAd.findUnique({ where: { id } });
  if (!ad) return { success: false, error: '광고를 찾을 수 없습니다.' };

  const kind = ((formData.get('kind') as string) ?? ad.kind).toUpperCase() === 'CLASS' ? 'CLASS' : 'ETC';
  const title = (formData.get('title') as string)?.trim() ?? '';
  const description = (formData.get('description') as string)?.trim() ?? '';
  const orderRaw = formData.get('order');
  const order = orderRaw !== null && orderRaw !== '' ? parseInt(String(orderRaw), 10) : ad.order;
  const safeOrder = isNaN(order) ? ad.order : order;

  let image = ad.image;
  let href = ad.href;
  let postId: number | null = null;

  if (kind === 'CLASS') {
    const postIdRaw = formData.get('postId');
    const pid = postIdRaw !== null && postIdRaw !== '' ? parseInt(String(postIdRaw), 10) : NaN;
    if (!pid || isNaN(pid)) return { success: false, error: '수업을 선택해 주세요.' };
    const resolved = await getImageAndHrefFromPostId(pid);
    image = resolved.image;
    href = resolved.href;
    postId = pid;
    if (ad.kind === 'ETC' && ad.image.startsWith('/ads/')) {
      const oldPath = path.join(process.cwd(), 'public', ad.image);
      try {
        await unlink(oldPath);
      } catch (_) {}
    }
  } else {
    const imageFile = formData.get('image');
    if (imageFile instanceof File && imageFile.size > 0) {
      image = await saveAdImage(imageFile);
      if (ad.image.startsWith('/ads/')) {
        const oldPath = path.join(process.cwd(), 'public', ad.image);
        try {
          await unlink(oldPath);
        } catch (_) {}
      }
    }
    href = (formData.get('href') as string)?.trim() ?? '';
    if (!href) return { success: false, error: '링크를 입력해 주세요.' };
  }

  if (!title) return { success: false, error: '제목은 필수입니다.' };

  await prisma.homeAd.update({
    where: { id },
    data: { kind, postId, image, title, description, href, order: safeOrder },
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/ads');
  redirect('/admin/ads');
}

export async function deleteHomeAd(id: number) {
  const ad = await prisma.homeAd.findUnique({ where: { id } });
  if (!ad) return;

  if (ad.image.startsWith('/ads/')) {
    const filePath = path.join(process.cwd(), 'public', ad.image);
    try {
      await unlink(filePath);
    } catch (_) {}
  }

  await prisma.homeAd.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/ads');
}
