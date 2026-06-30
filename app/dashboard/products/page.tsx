import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ProductsAdmin from "@/components/ProductsAdmin";

export default async function DashboardProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">إدارة المنتجات</h1>
        <p className="mt-2 text-sm text-muted">أضف، عدل، احذف وراقب بيانات المنتجات في الكتالوج.</p>
      </div>
      <ProductsAdmin initialProducts={products} />
    </section>
  );
}
