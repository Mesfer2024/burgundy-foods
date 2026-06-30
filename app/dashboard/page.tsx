import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const [ordersCount, customersCount, productsCount, totalSales, lowStockCount, recentOrders, recentQuotes] = await Promise.all([
    prisma.order.count(),
    prisma.customer.count(),
    prisma.product.count(),
    prisma.order.aggregate({ _sum: { totalAmount: true } }).then((result) => result._sum.totalAmount ?? 0),
    prisma.inventoryBatch.count({ where: { cartonQty: { lt: 20 } } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { customer: true } }),
    prisma.quoteRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <section className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: "إجمالي المبيعات", value: `${totalSales.toFixed(2)} ر.س` },
          { label: "عدد الطلبات", value: ordersCount },
          { label: "العملاء", value: customersCount },
        ].map((item) => (
          <div key={item.label} className="metric-card p-6">
            <p className="text-sm text-muted">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="data-card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">المخزون</p>
          <p className="mt-4 text-4xl font-semibold text-foreground">{lowStockCount}</p>
          <p className="mt-2 text-sm text-muted">منتجات منخفضة مخزون في الشحنات الحالية.</p>
        </div>
        <div className="data-card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">المنتجات</p>
          <p className="mt-4 text-4xl font-semibold text-foreground">{productsCount}</p>
          <p className="mt-2 text-sm text-muted">منتجات مضافة في كتالوج Burgundy Foods.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="data-card p-6">
          <h2 className="text-xl font-semibold text-foreground">آخر الطلبات</h2>
          <div className="mt-4 space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted">لا توجد طلبات بعد.</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="rounded-lg border border-border bg-background p-4">
                  <p className="text-sm font-semibold text-foreground">{order.customer?.name || "عميل"}</p>
                  <p className="text-sm text-muted">{new Date(order.createdAt).toLocaleDateString("ar-SA")}</p>
                  <p className="mt-2 text-sm">إجمالي الطلب: {order.totalAmount.toFixed(2)} ر.س</p>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="data-card p-6">
          <h2 className="text-xl font-semibold text-foreground">آخر طلبات عروض الأسعار</h2>
          <div className="mt-4 space-y-4">
            {recentQuotes.length === 0 ? (
              <p className="text-sm text-muted">لا توجد طلبات عروض أسعار بعد.</p>
            ) : (
              recentQuotes.map((quote) => (
                <div key={quote.id} className="rounded-lg border border-border bg-background p-4">
                  <p className="text-sm font-semibold text-foreground">{quote.customerName}</p>
                  <p className="text-sm text-muted">{new Date(quote.createdAt).toLocaleDateString("ar-SA")}</p>
                  <p className="mt-2 text-sm">نوع العميل: {quote.customerType}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
