import QuoteForm from "@/components/QuoteForm";
import TopNav from "@/components/TopNav";
import SiteFooter from "@/components/SiteFooter";
import prisma from "@/lib/prisma";
import QuotePageContent from "@/components/QuotePageContent";

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const selectedProductId = (await searchParams).product;
  const products = process.env.DATABASE_URL
    ? await prisma.product.findMany({ where: { active: true }, select: { id: true, nameAr: true, nameEn: true } })
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 py-14 lg:px-10">
        <QuotePageContent />
        <div className="mt-10">
          <QuoteForm key={selectedProductId ?? "quote"} products={products} selectedProductId={selectedProductId} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
