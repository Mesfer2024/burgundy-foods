import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import InvoicesAdmin from "@/components/InvoicesAdmin";

export default async function DashboardInvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const [invoices, customers, products, salesOrders, deliveryNotes] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, companyName: true } },
        salesOrder: { select: { id: true, salesOrderNumber: true } },
        deliveryNote: { select: { id: true, deliveryNoteNumber: true } },
        lines: true,
        payments: { select: { id: true, amount: true, paymentDate: true } },
      },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, companyName: true } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { nameAr: "asc" }, select: { id: true, nameAr: true, nameEn: true } }),
    prisma.salesOrder.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, salesOrderNumber: true, customerId: true } }),
    prisma.deliveryNote.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, deliveryNoteNumber: true } }),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">سجل الفواتير</h1>
        <p className="mt-2 text-sm text-muted">سجل داخلي للفواتير. ليس فاتورة ZATCA إلكترونية معتمدة حتى الآن.</p>
      </div>
      <InvoicesAdmin
        initialInvoices={JSON.parse(JSON.stringify(invoices))}
        customers={customers}
        products={products}
        salesOrders={salesOrders}
        deliveryNotes={deliveryNotes}
      />
    </section>
  );
}
