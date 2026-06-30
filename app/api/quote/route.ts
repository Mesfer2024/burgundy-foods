import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

type QuotePayload = {
  customerName?: unknown;
  companyName?: unknown;
  city?: unknown;
  phone?: unknown;
  email?: unknown;
  customerType?: unknown;
  items?: unknown;
  notes?: unknown;
};

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const text = textValue(value);
  return text.length > 0 ? text : null;
}

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as QuotePayload;
    const customerName = textValue(data.customerName);
    const city = textValue(data.city);
    const phone = textValue(data.phone);
    const email = textValue(data.email);
    const customerType = textValue(data.customerType);

    if (!customerName || !city || !phone || !email || !customerType || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ error: "بيانات طلب عرض السعر غير مكتملة." }, { status: 400 });
    }

    await prisma.quoteRequest.create({
      data: {
        customerName,
        companyName: optionalText(data.companyName),
        city,
        phone,
        email,
        customerType,
        items: JSON.stringify(data.items),
        notes: optionalText(data.notes),
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to submit quote request" }, { status: 500 });
  }
}
