"use server";

import { db } from "./lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";

export async function addNewPhoto(imageUrl: string) {
  const { userId } = await auth();

  if (!userId) throw new Error("Bạn phải đăng nhập!");

  await db.photo.create({
    data: {
      imageUrl: imageUrl,
      tags: [],
      userId: userId, 
    },
  });

  revalidatePath("/");
  redirect("/");
}

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function getPublicIdFromUrl(url: string) {
  const regex = /\/v\d+\/(.+)\.[a-z]+$/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export async function deletePhoto(photoId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  const photo = await db.photo.findUnique({
    where: { id: photoId },
  });

  if (!photo || photo.userId !== userId) {
    throw new Error("Không được xóa ảnh của người khác!");
  }

  const publicId = getPublicIdFromUrl(photo.imageUrl);
  
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log("Đã xóa ảnh trên Cloudinary:", publicId);
    } catch (error) {
      console.error("Lỗi khi xóa trên Cloudinary:", error);
    }
  }

  await db.photo.delete({
    where: { id: photoId },
  });

  revalidatePath("/");
  redirect("/");
}

export async function uploadMultiplePhotos(imageUrls: string[], tags: string[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Bạn phải đăng nhập!");

  await db.$transaction(
    imageUrls.map((url) =>
      db.photo.create({
        data: {
          imageUrl: url,
          tags: tags,
          userId: userId,
        },
      })
    )
  );

  revalidatePath("/");
  return { success: true };
}

export async function addTag(formData: FormData) {
  const tag = formData.get("tag") as string;
  const photoId = formData.get("photoId") as string;

  if (!tag || !photoId) return;

  await db.photo.update({
    where: { id: photoId },
    data: {
      tags: {
        push: tag,
      },
    },
  });

  revalidatePath(`/photo/${photoId}`);
  revalidatePath("/");
}

export async function removeTag(photoId: string, tagToRemove: string) {
  const photo = await db.photo.findUnique({ where: { id: photoId } });
  if (!photo) return;

  const newTags = photo.tags.filter((t) => t !== tagToRemove);

  await db.photo.update({
    where: { id: photoId },
    data: { tags: newTags },
  });

  revalidatePath(`/photo/${photoId}`);
  revalidatePath("/");
}

export async function editTag(photoId: string, oldTag: string, newTag: string) {
  const photo = await db.photo.findUnique({ where: { id: photoId } });
  if (!photo) return;

  const newTags = photo.tags.map((t) => (t === oldTag ? newTag : t));

  await db.photo.update({
    where: { id: photoId },
    data: { tags: newTags },
  });

  revalidatePath(`/photo/${photoId}`);
  revalidatePath("/");
}