import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function Home() {
  const homeAds = await prisma.homeAd.findMany({
    orderBy: { order: 'asc' },
  });

  const HOME_ADS = homeAds.map((ad) => ({
    id: ad.id,
    image: ad.image,
    title: ad.title,
    description: ad.description,
    href: ad.href,
  }));
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Latin in Seoul
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            서울의 라틴 댄스 수업을 찾아보세요
          </p>
          <Link
            href="/posts"
            className="inline-block bg-slate-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-slate-700 transition-colors"
          >
            수업 게시판 보기 →
          </Link>
        </div>

        {/* 광고 목록 (좌 1/4 이미지, 우 3/4 제목·내용) */}
        <section className="mt-12">
          <div className="space-y-4">
            {HOME_ADS.map((ad) => {
              const isExternal = ad.href.startsWith('http');
              const content = (
                <>
                  <div className="w-1/4 shrink-0 overflow-hidden rounded-l-xl bg-slate-200 aspect-[4/3] min-h-[100px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ad.image}
                      alt={ad.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center p-4">
                    <h3 className="font-semibold text-gray-800 mb-1">{ad.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{ad.description}</p>
                  </div>
                </>
              );
              const cardClass =
                'flex bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow';
              if (isExternal) {
                return (
                  <a
                    key={ad.id}
                    href={ad.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cardClass}
                  >
                    {content}
                  </a>
                );
              }
              return (
                <Link key={ad.id} href={ad.href} className={cardClass}>
                  {content}
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
