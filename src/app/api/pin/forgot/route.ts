import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/app/lib/db';
import * as bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses?.[0]?.emailAddress;
    if (!email) return NextResponse.json({ success: false, error: 'Không tìm thấy email người dùng.' }, { status: 400 });

    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    const pinHash = await bcrypt.hash(newPin, 10);

    await db.userSetting.upsert({
      where: { userId },
      update: { pinHash },
      create: { userId, pinHash },
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || 'no-reply@photo-locker.local',
      to: email,
      subject: 'Yêu cầu đặt lại PIN - Photo Locker',
      text: `Mã PIN mới của bạn là: ${newPin}\nVui lòng sử dụng mã này để mở khóa locker. Bạn có thể đổi mã này sau khi đăng nhập.`,
      html: `<p>Mã PIN mới của bạn là: <strong>${newPin}</strong></p><p>Vui lòng sử dụng mã này để mở khóa locker. Bạn có thể đổi mã này sau khi đăng nhập.</p>`,
    } as any;

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('pin/forgot error', err);
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
