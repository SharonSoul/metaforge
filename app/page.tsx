import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { MetaGenerator } from "@/components/meta-generator"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <MetaGenerator />
      <Footer />
    </div>
  )
}
