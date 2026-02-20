import sharp from 'sharp';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * 5MB 초과 시 리사이즈·JPEG 압축해 약 5MB 이하로 만듦.
 * 수업 이미지·광고 이미지 업로드 공용.
 */
export async function compressIfNeeded(
  buffer: Buffer,
  ext: string
): Promise<{ buffer: Buffer; ext: string }> {
  if (buffer.length <= MAX_SIZE_BYTES) return { buffer, ext };

  const maxSide = 2560;
  let quality = 85;

  for (;;) {
    const out = await sharp(buffer)
      .resize(maxSide, maxSide, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    if (out.length <= MAX_SIZE_BYTES || quality <= 50) {
      return { buffer: out, ext: '.jpg' };
    }
    quality -= 10;
  }
}
