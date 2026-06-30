import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import InventoryAdmin from "@/components/InventoryAdmin";

export default async function DashboardInventoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const [batches, products] = await Promise.all([
    prisma.inventoryBatch.findMany({
      orderBy: { createdAt: "desc" },
      include: { product: true },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, nameAr: true, packsPerCarton: true },
    }),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">إدارة المخزون</h1>
        <p className="mt-2 text-sm text-muted">سجل الشحنات ومراقبة الكميات وتواريخ الانتاج والانتهاء.</p>
      </div>
      <InventoryAdmin initialBatches={batches} products={products} />
    </section>
  );
}
