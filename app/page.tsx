import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { WhyChooseSection } from "@/components/why-choose-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { FeaturesSection } from "@/components/features-section"
import { StatsSection } from "@/components/stats-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <WhyChooseSection />
        <HowItWorksSection />
        <FeaturesSection />
        <StatsSection />
      </main>
      <Footer />
    </div>
  )
}
