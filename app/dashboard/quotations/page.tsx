import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import QuotationsAdmin from "@/components/QuotationsAdmin";

export default async function DashboardQuotationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const [quotations, customers, products] = await Promise.all([
    prisma.quotation.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { id: true, name: true, companyName: true } }, lines: true },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, companyName: true } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { nameAr: "asc" }, select: { id: true, nameAr: true, nameEn: true } }),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">عروض الأسعار</h1>
        <p className="mt-2 text-sm text-muted">أنشئ عروض الأسعار، ثم حوّل المقبولة منها إلى أوامر بيع.</p>
      </div>
      <QuotationsAdmin
        initialQuotations={JSON.parse(JSON.stringify(quotations))}
        customers={customers}
        products={products}
      />
    </section>
  );
}
