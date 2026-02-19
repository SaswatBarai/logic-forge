import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { StatsSection } from "@/components/StatsSection";
import { MissionsSection } from "@/components/MissionsSection";
import { AntiCheatSection } from "@/components/AntiCheatSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <StatsSection />
        <MissionsSection />
        <AntiCheatSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
