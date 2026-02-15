import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import VisitRecorder from "./components/VisitRecorder";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
