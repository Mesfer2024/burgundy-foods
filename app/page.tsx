import TopNav from "@/components/TopNav";
import SiteFooter from "@/components/SiteFooter";
import CinemaHero from "@/components/CinemaHero";
import CinemaTrustStrip from "@/components/CinemaTrustStrip";
import CinemaCollections from "@/components/CinemaCollections";
import CinemaWholesale from "@/components/CinemaWholesale";
import CinemaCta from "@/components/CinemaCta";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main>
        <CinemaHero />
        <CinemaTrustStrip />
        <CinemaCollections />
        <CinemaWholesale />
        <CinemaCta />
      </main>
      <SiteFooter />
    </div>
  );
}
