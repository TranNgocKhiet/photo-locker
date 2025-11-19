import { auth, currentUser } from "@clerk/nextjs/server";
import PhotoGallery from "./components/PhotoGallery"; 
import { db } from "./lib/db";
import Link from "next/link";
import { Suspense } from "react";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tags?: string }>;
}) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Photo Locker 🔒</h1>
          <p className="text-gray-600 mb-6">Kho lưu trữ ảnh riêng tư và bảo mật. Đăng nhập để bắt đầu.</p>
          <div className="text-sm text-blue-600 font-semibold bg-blue-50 py-2 px-4 rounded-full inline-block">Vui lòng đăng nhập ở góc phải ↗</div>
        </div>
      </div>
    );
  }

  const allPhotosRaw = await db.photo.findMany({
    where: { userId },
    select: { tags: true },
  });
  const uniqueTags = Array.from(new Set(allPhotosRaw.flatMap((p) => p.tags)));

  return (
    <div className="p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Xin chào, {user?.firstName || "Bạn"}! 👋
          </h1>
          <p className="text-gray-500">Bộ sưu tập ảnh của bạn.</p>
        </div>
        <Link 
          href="/upload" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 shadow-md transition-transform hover:scale-105"
        >
          <span>+</span> Tải thêm
        </Link>
      </div>

      <Suspense fallback={<div>Đang tải bộ sưu tập...</div>}>
         <PhotoGallery initialTags={uniqueTags} />
      </Suspense>
    </div>
  );
}