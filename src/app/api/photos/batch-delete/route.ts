import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/app/lib/db';
import { v2 as cloudinary } from 'cloudinary';

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

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];

    if (ids.length === 0) return NextResponse.json({ success: false, error: 'No ids provided' }, { status: 400 });

    // Validate ownership and collect publicIds
    const photos = await db.photo.findMany({ where: { id: { in: ids } }, select: { id: true, userId: true, imageUrl: true } });

    const unauthorized = photos.some(p => p.userId !== userId);
    if (unauthorized) return NextResponse.json({ success: false, error: 'Not allowed to delete some photos' }, { status: 403 });

    // Delete from Cloudinary where applicable
    const publicIds = photos.map(p => getPublicIdFromUrl(p.imageUrl)).filter(Boolean) as string[];

    await Promise.all(publicIds.map(id => cloudinary.uploader.destroy(id)));

    // Delete from database
    await db.photo.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Batch delete error', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
