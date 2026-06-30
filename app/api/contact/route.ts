import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
};

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const data = (await request.json()) as ContactPayload;
  const name = textValue(data.name);
  const email = textValue(data.email);
  const phone = textValue(data.phone);
  const message = textValue(data.message);

  if (!name || !email || !phone || !message) {
    return NextResponse.json({ error: "بيانات التواصل غير مكتملة." }, { status: 400 });
  }

  await prisma.contactMessage.create({
    data: {
      name,
      email,
      phone,
      message,
    },
  });

  return NextResponse.json({ success: true });
}
