"use server";

import { db } from "./lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";
import * as bcrypt from 'bcrypt';
import { cookies } from 'next/headers';

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

export async function setLockPin(formData: FormData) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const pin = formData.get('pin') as string;
    if (!pin || pin.length !== 4) throw new Error("PIN phải có 4 chữ số.");

    const pinHash = await bcrypt.hash(pin, 10);

    await db.userSetting.upsert({
        where: { userId: userId },
        update: { pinHash: pinHash },
        create: { userId: userId, pinHash: pinHash },
    });

    revalidatePath('/locker');
    redirect('/locker');
}

export async function toggleLockPhoto(photoId: string, lockState: boolean) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await db.photo.update({
        where: { id: photoId, userId: userId },
        data: { isLocked: lockState },
    });

    revalidatePath('/');
    revalidatePath('/locker');
}

export async function verifyPin(formData: FormData): Promise<{ success: boolean }> {
    const { userId } = await auth();
    if (!userId) return { success: false };

    const pin = formData.get('pin') as string;

    const setting = await db.userSetting.findUnique({
        where: { userId: userId },
        select: { pinHash: true },
    });

    if (!setting?.pinHash) return { success: false };

    const isMatch = await bcrypt.compare(pin, setting.pinHash);
    
    return { success: isMatch };
}

export async function changePin(formData: FormData): Promise<{ success: boolean, error?: string }> {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const oldPin = formData.get('oldPin') as string;
    const newPin = formData.get('newPin') as string;

    if (!oldPin || !newPin || newPin.length !== 4) {
        return { success: false, error: "Dữ liệu PIN không hợp lệ." };
    }

    const setting = await db.userSetting.findUnique({
        where: { userId: userId },
        select: { pinHash: true },
    });

    if (!setting?.pinHash) {
        return { success: false, error: "Chưa thiết lập PIN." }; 
    }

    const isOldPinMatch = await bcrypt.compare(oldPin, setting.pinHash);
    if (!isOldPinMatch) {
        return { success: false, error: "Mã PIN cũ không chính xác." };
    }

    const newPinHash = await bcrypt.hash(newPin, 10);

    await db.userSetting.update({
        where: { userId: userId },
        data: { pinHash: newPinHash },
    });

    revalidatePath('/');
    return { success: true };
}

export async function isLockerUnlockedServer(): Promise<boolean> {
    const cookieStore = cookies();
    const status = (await cookieStore).get('photoLockerUnlocked')?.value;
    return status === 'true';
}