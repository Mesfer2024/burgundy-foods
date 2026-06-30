import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import SalesOrdersAdmin from "@/components/SalesOrdersAdmin";

export default async function DashboardSalesOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const [orders, customers, products] = await Promise.all([
    prisma.salesOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, companyName: true } },
        quotation: { select: { id: true, quotationNumber: true } },
        lines: true,
      },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, companyName: true } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { nameAr: "asc" }, select: { id: true, nameAr: true, nameEn: true } }),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">أوامر البيع</h1>
        <p className="mt-2 text-sm text-muted">أنشئ أوامر بيع رسمية، وتابع تسلسلها من العرض إلى التسليم والفاتورة.</p>
      </div>
      <SalesOrdersAdmin
        initialOrders={JSON.parse(JSON.stringify(orders))}
        customers={customers}
        products={products}
      />
    </section>
  );
}
