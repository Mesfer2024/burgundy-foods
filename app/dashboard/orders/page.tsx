import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import OrdersAdmin from "@/components/OrdersAdmin";

// TODO: Phase 2B — this page uses the legacy `Order`/`OrderItem` models and predates
// the formal wholesale flow under /dashboard/sales-orders (Quotation → SalesOrder →
// DeliveryNote → Invoice → Payment). It is no longer linked from the sidebar nav.
// Decide before next release whether to:
//   (a) `redirect("/dashboard/sales-orders")` and drop the legacy `Order` model,
//   (b) migrate any production rows into `SalesOrder` and then redirect, or
//   (c) keep it as a quick-entry shortcut for one-off internal orders.

export default async function DashboardOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const [orders, products, customers] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: { include: { product: true } } },
    }),
    prisma.product.findMany({ select: { id: true, nameAr: true, cartonSale: true } }),
    prisma.customer.findMany({ select: { id: true, name: true } }),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">إدارة الطلبات</h1>
        <p className="mt-2 text-sm text-muted">تسجيل الطلبات الجديدة ومراجعة الطلبات السابقة.</p>
      </div>
      <OrdersAdmin initialOrders={orders} products={products} customers={customers} />
    </section>
  );
}
