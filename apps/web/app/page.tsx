import { Navbar }            from "@/components/Navbar";
import { HeroSection }       from "@/components/HeroSection";
import { MarqueeTicker }     from "@/components/MarqueeTicker";
import { StatsSection }      from "@/components/StatsSection";
import { CategoriesSection } from "@/components/CategoriesSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { AntiCheatSection }  from "@/components/AntiCheatSection";
import { CTASection }        from "@/components/CTASection";
import { Footer }            from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-x-hidden">
      <Navbar />
      <MarqueeTicker />
      <main className="flex-grow">
        <HeroSection />
        <StatsSection />
        <CategoriesSection />
        <HowItWorksSection />
        <AntiCheatSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
