import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import SuppliersAdmin from "@/components/SuppliersAdmin";

export default async function DashboardSuppliersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const suppliers = await prisma.supplier.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">إدارة الموردين</h1>
        <p className="mt-2 text-sm text-muted">سجل المصنعين والموزعين والوكلاء، ثم اربطهم بالمنتجات وفواتير الشراء.</p>
      </div>
      <SuppliersAdmin initialSuppliers={JSON.parse(JSON.stringify(suppliers))} />
    </section>
  );
}
