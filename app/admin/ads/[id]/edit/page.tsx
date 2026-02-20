import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdForm from '../../AdForm';
import { updateHomeAd } from '../../actions';

export default async function EditAdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adId = parseInt(id, 10);
  if (isNaN(adId)) notFound();

  const ad = await prisma.homeAd.findUnique({ where: { id: adId } });
  if (!ad) notFound();

  return (
    <div className="container mx-auto px-4 py-10 max-w-xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">광고 수정</h1>
        <p className="text-sm text-gray-500 mt-1">메인 페이지 추천 영역에 노출되는 내용을 수정합니다.</p>
      </header>

      <AdForm
        action={updateHomeAd}
        initial={{
          kind: ad.kind,
          postId: ad.postId ?? null,
          image: ad.image,
          title: ad.title,
          description: ad.description,
          href: ad.href,
          order: ad.order,
        }}
        submitLabel="수정 완료"
        adId={ad.id}
      />

      <p className="mt-4">
        <Link href="/admin/ads" className="text-sm text-gray-500 hover:text-gray-700 underline">
          ← 광고 목록으로
        </Link>
      </p>
    </div>
  );
}
