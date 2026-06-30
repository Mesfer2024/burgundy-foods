import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PaymentsAdmin from "@/components/PaymentsAdmin";

export default async function DashboardPaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const [payments, customers, invoices] = await Promise.all([
    prisma.paymentReceipt.findMany({
      orderBy: { paymentDate: "desc" },
      include: {
        customer: { select: { id: true, name: true, companyName: true } },
        invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, balanceDue: true } },
      },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, companyName: true } }),
    prisma.invoice.findMany({
      where: { status: { not: "cancelled" } },
      orderBy: { invoiceDate: "desc" },
      select: { id: true, invoiceNumber: true, customerId: true, totalAmount: true, balanceDue: true },
    }),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">المقبوضات والمدفوعات</h1>
        <p className="mt-2 text-sm text-muted">سجّل الدفعات الواردة. ربط الدفعة بفاتورة يحدّث رصيدها وحالتها تلقائياً.</p>
      </div>
      <PaymentsAdmin
        initialPayments={JSON.parse(JSON.stringify(payments))}
        customers={customers}
        invoices={invoices}
      />
    </section>
  );
}
