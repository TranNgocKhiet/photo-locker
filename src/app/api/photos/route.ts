import { db } from "../../lib/db";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const PHOTOS_PER_PAGE = 8;

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized or User ID missing", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * PHOTOS_PER_PAGE;
    
    const tagsQuery = searchParams.get('tags');
    const tagsArray = tagsQuery 
        ? tagsQuery.split(',').filter(t => t.trim() !== '') 
        : [];
    
    let whereClause: any = { userId };

    if (tagsArray.length > 0) {
        whereClause.tags = { hasSome: tagsArray };
    }
    
    const photos = await db.photo.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: PHOTOS_PER_PAGE,
      skip: skip,
    });

    const totalCount = await db.photo.count({ where: whereClause });

    return NextResponse.json({
      photos: photos,
      totalCount: totalCount,
      limit: PHOTOS_PER_PAGE,
      currentPage: page,
    });

  } catch (error) {
    console.error("API PRISMA ERROR:", error);
    return new NextResponse("Internal Server Error during data processing", { status: 500 });
  }
}