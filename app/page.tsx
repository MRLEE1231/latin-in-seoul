import Link from 'next/link';

export default function Home() {
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">살사</h2>
            <p className="text-gray-600">
              열정적인 쿠바의 리듬을 느껴보세요
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">바차타</h2>
            <p className="text-gray-600">
              로맨틱한 도미니카의 멜로디
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">키좀바</h2>
            <p className="text-gray-600">
              아프리카의 감성적인 리듬
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
