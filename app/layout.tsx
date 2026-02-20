import type { Metadata } from "next";
import Link from "next/link";
import VisitRecorder from "./components/VisitRecorder";
import "./globals.css";

// Google Fonts 대신 시스템 폰트 사용 (Docker 빌드 시 네트워크 없어도 됨)
export const metadata: Metadata = {
  title: "Latin in Seoul - 라틴 댄스 수업 게시판",
  description: "서울의 라틴 댄스 수업 정보를 찾아보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <VisitRecorder />
        <nav className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold text-slate-600">
                Latin in Seoul
              </Link>
              <div className="flex gap-4">
                <Link
                  href="/"
                  className="text-gray-700 hover:text-slate-600 transition-colors"
                >
                  홈
                </Link>
                <Link
                  href="/posts"
                  className="text-gray-700 hover:text-slate-600 transition-colors"
                >
                  수업 게시판
                </Link>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
