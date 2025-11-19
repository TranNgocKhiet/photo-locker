import { db } from "../../lib/db";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ isSet: false }, { status: 200 });
  }

  try {
    const setting = await db.userSetting.findUnique({
      where: { userId: userId },
      select: { pinHash: true },
    });

    const isSet = !!setting?.pinHash;
    return NextResponse.json({ isSet });
  } catch (error) {
    console.error("API Error checking pin status:", error);
    return NextResponse.json({ isSet: false });
  }
}