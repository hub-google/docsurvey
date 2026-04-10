import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "醫師公會職域活化報名系統",
  description: "醫師公會職域活化報名系統 - 登入與報名",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
