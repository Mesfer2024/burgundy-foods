import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DeliveryNotesAdmin from "@/components/DeliveryNotesAdmin";

export default async function DashboardDeliveryNotesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const [notes, customers, products, salesOrders] = await Promise.all([
    prisma.deliveryNote.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, companyName: true } },
        salesOrder: { select: { id: true, salesOrderNumber: true } },
        lines: true,
      },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, companyName: true } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { nameAr: "asc" }, select: { id: true, nameAr: true, nameEn: true } }),
    prisma.salesOrder.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, salesOrderNumber: true, customerId: true } }),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">سندات التسليم</h1>
        <p className="mt-2 text-sm text-muted">سجل خروج البضاعة من المستودع وربطها بأمر البيع والعميل.</p>
      </div>
      <DeliveryNotesAdmin
        initialNotes={JSON.parse(JSON.stringify(notes))}
        customers={customers}
        products={products}
        salesOrders={salesOrders}
      />
    </section>
  );
}
