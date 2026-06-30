import TopNav from "@/components/TopNav";
import SiteFooter from "@/components/SiteFooter";
import prisma from "@/lib/prisma";
import ContactPageContent from "@/components/ContactPageContent";

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
