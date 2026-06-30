import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import CustomersAdmin from "@/components/CustomersAdmin";

export default async function DashboardCustomersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const customers = await prisma.customer.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">إدارة العملاء</h1>
        <p className="mt-2 text-sm text-muted">أنشئ سجل عملاء جديدًا وراجع بياناتهم وسجل الطلبات لاحقاً.</p>
      </div>
      <CustomersAdmin initialCustomers={customers} />
    </section>
  );
}
