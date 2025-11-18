import { db } from "../../lib/db";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import PhotoFullscreen from "../../components/PhotoFullscreen";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tags?: string }>;
}

export default async function PhotoDetailPage({ params, searchParams }: PageProps) {
  const { userId } = await auth();
  const { id } = await params;
  const { tags } = await searchParams;

  if (!userId) return <div>Unauthorized</div>;

  const photo = await db.photo.findUnique({ where: { id } });

  if (!photo) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl text-red-500">No image found!</h1>
        <Link href="/" className="text-blue-500 hover:underline">Return to home page</Link>
      </div>
    );
  }

  const tagArray = tags ? tags.split(",") : [];
  const backLink = tags ? `/?tags=${tags}` : "/";
  const allRelevantPhotos = await db.photo.findMany({
    where: {
      userId: userId,
      ...(tagArray.length > 0 ? { tags: { hasSome: tagArray } } : {}),
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  const currentIndex = allRelevantPhotos.findIndex((p) => p.id === id);
  const prevPhotoId = currentIndex > 0 ? allRelevantPhotos[currentIndex - 1].id : null;
  const nextPhotoId = currentIndex < allRelevantPhotos.length - 1 ? allRelevantPhotos[currentIndex + 1].id : null;

  const getLink = (photoId: string) => `/photo/${photoId}${tags ? `?tags=${tags}` : ""}`;

  const prevLink = prevPhotoId ? getLink(prevPhotoId) : null;
  const nextLink = nextPhotoId ? getLink(nextPhotoId) : null;

  return (
    <PhotoFullscreen
      photo={photo}
      prevLink={prevLink}
      nextLink={nextLink}
      backLink={backLink}
      tagName={tags}
    />
  );
}