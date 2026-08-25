import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "案件収支管理",
  description: "案件単位で売上・支払いを管理するアプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
