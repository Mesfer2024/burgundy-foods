import TopNav from "@/components/TopNav";
import SiteFooter from "@/components/SiteFooter";
import prisma from "@/lib/prisma";
import ContactPageContent from "@/components/ContactPageContent";

// Force per-request rendering so admin updates to the company contact info
// (phone, email, address) appear on the public contact page immediately.
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = process.env.DATABASE_URL ? await prisma.companySetting.findFirst() : null;
  const contactSettings = settings
    ? { phone: settings.phone, email: settings.email, address: settings.address }
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 py-14 lg:px-10">
        <ContactPageContent settings={contactSettings} />
      </main>
      <SiteFooter />
    </div>
  );
}
