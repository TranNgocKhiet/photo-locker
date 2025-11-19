import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs"; 
import Navbar from "./components/Navbar";       
import BodyWrapper from "./components/BodyWrapper"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Photo Locker | Kho Lưu Trữ Ảnh Riêng Tư Bảo Mật",
  description: "Photo Locker là giải pháp lưu trữ ảnh cá nhân, bảo mật bằng PIN và được đồng bộ trên Cloud.",
  keywords: ["Photo Locker", "lưu trữ ảnh", "bảo mật ảnh", "Next.js Gallery"],
  creator: "Tran Ngoc Khiet / Slayer",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Navbar />
          <BodyWrapper>
            <div className="min-h-screen bg-gray-50" style={{ paddingTop: '64px' }}>
              {children}
            </div>
          </BodyWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}