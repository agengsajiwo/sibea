import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistem Informasi Beasiswa Doktor — UNU Yogyakarta",
  description:
    "Portal beasiswa program doktor (S3) untuk dosen Universitas Nahdlatul Ulama (UNU) Yogyakarta",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
