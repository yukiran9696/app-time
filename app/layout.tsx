import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "東京ディズニー 待ち時間",
  description: "東京ディズニーランド・ディズニーシーのリアルタイム待ち時間と営業状況",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
