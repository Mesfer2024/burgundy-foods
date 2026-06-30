import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { compare } from "bcrypt";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// RFC-ish lightweight email regex — anchored, requires single @, no spaces, has a TLD.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح. سجل الدخول أولاً." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { currentPassword?: unknown; newEmail?: unknown }
    | null;

  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newEmail = typeof body?.newEmail === "string" ? body.newEmail.trim().toLowerCase() : "";

  if (!currentPassword) {
    return NextResponse.json({ error: "كلمة المرور الحالية مطلوبة." }, { status: 400 });
  }
  if (!newEmail) {
    return NextResponse.json({ error: "البريد الإلكتروني الجديد مطلوب." }, { status: 400 });
  }
  if (!EMAIL_REGEX.test(newEmail)) {
    return NextResponse.json({ error: "صيغة البريد الإلكتروني غير صحيحة." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.password) {
    return NextResponse.json({ error: "تعذر التحقق من الحساب." }, { status: 401 });
  }

  const passwordMatches = await compare(currentPassword, user.password);
  if (!passwordMatches) {
    return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة." }, { status: 401 });
  }

  if (newEmail === user.email.toLowerCase()) {
    return NextResponse.json({ error: "البريد الجديد مطابق للحالي." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existing && existing.id !== user.id) {
    return NextResponse.json({ error: "هذا البريد مستخدم لحساب آخر." }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { email: newEmail },
  });

  // The browser session cookie still references the old email until it expires.
  // We return signOut=true so the client clears its session and routes back to
  // the sign-in page with the new email pre-filled.
  return NextResponse.json({ success: true, signOut: true, newEmail });
}
