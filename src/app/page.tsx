import Image from "next/image";
import Link from "next/link";
import { db } from "./lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import TagChip from "./components/TagChip";
import TagSearchFilter from "./components/TagSearchFilter";

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
          <p className="text-gray-600 mb-6">
            Kho lưu trữ ảnh riêng tư và bảo mật. Đăng nhập để bắt đầu.
          </p>
          <div className="text-sm text-blue-600 font-semibold bg-blue-50 py-2 px-4 rounded-full inline-block">
            Vui lòng đăng nhập ở góc phải ↗
          </div>
        </div>
      </div>
    );
  }

  const { tags } = await searchParams;
  const selectedTags = tags ? tags.split(",") : [];

  const allPhotosRaw = await db.photo.findMany({
    where: { userId },
    select: { tags: true },
  });
  const uniqueTags = Array.from(new Set(allPhotosRaw.flatMap((p) => p.tags)));

  const photos = await db.photo.findMany({
    where: {
      userId: userId,
      ...(selectedTags.length > 0
        ? {
            tags: {
              hasSome: selectedTags,
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const queryString = tags ? `?tags=${tags}` : "";

  return (
    <div className="p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Xin chào, {user?.firstName || "Bạn"}! 👋
          </h1>
          <p className="text-gray-500">
            {selectedTags.length > 0
              ? `Đang lọc theo: ${selectedTags.join(", ")}`
              : "Đây là bộ sưu tập của bạn."}
          </p>
        </div>

        <Link 
          href="/upload" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 shadow-md transition-transform hover:scale-105"
        >
          <span>+</span> Tải thêm
        </Link>
      </div>

      <TagSearchFilter allTags={uniqueTags} />

      {photos.length === 0 ? (
        <div className="text-center text-gray-400 mt-10 py-20 border-2 border-dashed border-gray-200 rounded-xl">
            {selectedTags.length > 0 
              ? "Không tìm thấy ảnh nào với các tag này." 
              : "Kho ảnh trống trơn. Tải lên ngay!"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
          {photos.map((photo) => (
            <Link 
              href={`/photo/${photo.id}${queryString}`}
              key={photo.id} 
              className="relative group block aspect-square overflow-hidden rounded-xl bg-gray-100 shadow-sm border border-gray-200 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <Image
                src={photo.imageUrl}
                alt="Photo"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div className="flex gap-1 flex-wrap">
                  {photo.tags.slice(0, 3).map(tag => (
                    <TagChip key={tag} tag={tag} />
                  ))}
                  {photo.tags.length > 3 && <span className="text-[10px] text-white px-1">...</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}