import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { SimpleMediaDownloader } from "@/components/simple-media-downloader"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <SimpleMediaDownloader />
      <Footer />
    </div>
  )
}
