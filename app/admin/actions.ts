'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export type CreatePostResult = { success: true } | { success: false; error: string };

export async function createPost(formData: FormData): Promise<CreatePostResult> {
  try {
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const region = formData.get('region') as string;
    const danceType = formData.get('danceType') as string;
    const instructorName = formData.get('instructorName') as string;
    const classDescription = formData.get('classDescription') as string;
    const keywordsRaw = (formData.get('keywords') as string) || '';
    const keywords = keywordsRaw
      .split('#')
      .map((s) => s.trim())
      .filter(Boolean)
      .join(',') || undefined;

    const classDays = formData.getAll('classDays') as string[];
    const classDaysString = classDays.join(',');

    const startDateRaw = (formData.get('startDate') as string) || '';
    const endDateRaw = (formData.get('endDate') as string) || '';
    const startDate = startDateRaw && startDateRaw.trim() ? new Date(startDateRaw.trim() + 'T00:00:00') : undefined;
    const endDate = endDateRaw && endDateRaw.trim() ? new Date(endDateRaw.trim() + 'T00:00:00') : undefined;

    const rawFiles = formData.getAll('images');
    const savedImageUrls: string[] = [];
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    for (const raw of rawFiles) {
      if (!(raw instanceof File) || raw.size === 0) continue;
      const file = raw;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileExtension = path.extname(file.name) || '.jpg';
      const fileName = `${uuidv4()}${fileExtension}`;
      const relativePath = `/uploads/${fileName}`;
      const absolutePath = path.join(uploadsDir, fileName);

      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (_) {}
      await writeFile(absolutePath, buffer);
      savedImageUrls.push(relativePath);
    }

    await prisma.post.create({
      data: {
        title: title || undefined,
        content: (content && content.trim()) ? content.trim() : '',
        region: region || undefined,
        danceType: danceType || undefined,
        instructorName: instructorName || undefined,
        classDays: classDaysString || undefined,
        startDate,
        endDate,
        keywords,
        classDescription: classDescription || undefined,
        ...(savedImageUrls.length > 0 && {
          images: {
            create: savedImageUrls.map((url, index) => ({
              imageUrl: url,
              imageOrder: index,
            })),
          },
        }),
      },
    });

    revalidatePath('/posts');
    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    console.error('createPost error:', err);
    const message = err instanceof Error ? err.message : '수업 등록 중 오류가 발생했습니다.';
    return { success: false, error: message };
  }
}

export async function updatePost(formData: FormData) {
  const id = Number(formData.get('id'));
  if (!id || isNaN(id)) throw new Error('잘못된 게시글 ID입니다.');

  const post = await prisma.post.findUnique({
    where: { id },
    include: { images: { orderBy: { imageOrder: 'asc' } } },
  });
  if (!post) throw new Error('게시글을 찾을 수 없습니다.');

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const region = formData.get('region') as string;
  const danceType = formData.get('danceType') as string;
  const instructorName = formData.get('instructorName') as string;
  const classDescription = formData.get('classDescription') as string;
  const keywordsRaw = (formData.get('keywords') as string) || '';
  const keywords = keywordsRaw
    .split('#')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(',') || undefined;

  const classDays = formData.getAll('classDays') as string[];
  const classDaysString = classDays.join(',');

  const startDateRaw = (formData.get('startDate') as string) || '';
  const endDateRaw = (formData.get('endDate') as string) || '';
  const startDate = startDateRaw && startDateRaw.trim() ? new Date(startDateRaw.trim() + 'T00:00:00') : null;
  const endDate = endDateRaw && endDateRaw.trim() ? new Date(endDateRaw.trim() + 'T00:00:00') : null;

  const rawFiles = formData.getAll('images');
  const files = rawFiles.filter((f): f is File => f instanceof File && f.size > 0);
  const savedImageUrls: { url: string; order: number }[] = [];
  const existingCount = post.images.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExtension = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExtension}`;
    const relativePath = `/uploads/${fileName}`;
    const absolutePath = path.join(process.cwd(), 'public', 'uploads', fileName);
    await writeFile(absolutePath, buffer);
    savedImageUrls.push({ url: relativePath, order: existingCount + i });
  }

  await prisma.post.update({
    where: { id },
    data: {
      title,
      content: (content != null && content.trim()) ? content.trim() : '',
      region,
      danceType,
      instructorName,
      classDays: classDaysString,
      startDate,
      endDate,
      keywords,
      classDescription,
      ...(savedImageUrls.length > 0 && {
        images: {
          create: savedImageUrls.map(({ url, order }) => ({ imageUrl: url, imageOrder: order })),
        },
      }),
    },
  });

  revalidatePath('/posts');
  revalidatePath(`/posts/${id}`);
  revalidatePath('/admin');
  redirect('/admin');
}

export async function deletePostImage(imageId: number) {
  const image = await prisma.postImage.findUnique({
    where: { id: imageId },
    include: { post: true },
  });
  if (!image) return;
  const postId = image.postId;

  if (image.imageUrl.startsWith('/uploads/')) {
    const fileName = image.imageUrl.replace('/uploads/', '');
    const absolutePath = path.join(process.cwd(), 'public', 'uploads', fileName);
    try {
      await unlink(absolutePath);
    } catch (err) {
      console.error('Failed to delete file:', absolutePath, err);
    }
  }

  await prisma.postImage.delete({
    where: { id: imageId },
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/posts/${postId}/edit`);
  revalidatePath(`/posts/${postId}`);
  revalidatePath('/posts');
}

export async function deletePost(id: number, options?: { skipRevalidate?: boolean }) {
  // Find the post and its images first to delete actual files
  const post = await prisma.post.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!post) return;

  // Delete actual image files from disk
  for (const image of post.images) {
    if (image.imageUrl.startsWith('/uploads/')) {
      const fileName = image.imageUrl.replace('/uploads/', '');
      const absolutePath = path.join(process.cwd(), 'public', 'uploads', fileName);
      try {
        await unlink(absolutePath);
      } catch (err) {
        console.error('Failed to delete file:', absolutePath, err);
      }
    }
  }

  // Delete from database (Cascade will handle PostImage)
  await prisma.post.delete({
    where: { id },
  });

  if (!options?.skipRevalidate) {
    revalidatePath('/posts');
    revalidatePath('/admin');
  }
}

export async function bulkDeletePosts(formData: FormData) {
  const rawIds = formData.getAll('ids');
  const ids = rawIds
    .map((v) => Number(typeof v === 'string' ? v : String(v)))
    .filter((n) => !isNaN(n));

  if (ids.length === 0) {
    return;
  }

  for (const id of ids) {
    await deletePost(id, { skipRevalidate: true });
  }

  revalidatePath('/posts');
  revalidatePath('/admin');
}
