"use client"

import { Button } from "@/components/ui/button"
import { ArrowDown } from 'lucide-react'

export function HeroSection() {
  const scrollToDownloader = () => {
    document.getElementById("media-downloader")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto text-center max-w-4xl">
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Simple{" "}
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Media Downloader
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Extract direct links to videos and images from TikTok and Instagram. Simple, fast, and reliable.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button
              size="lg"
              onClick={scrollToDownloader}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
            >
              Start Extracting
              <ArrowDown className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-sm text-muted-foreground">Free • No signup required • Direct links</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-pink-600">🎵</div>
              <h3 className="font-semibold">TikTok Videos</h3>
              <p className="text-sm text-muted-foreground">Extract HD videos from any TikTok URL</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">📷</div>
              <h3 className="font-semibold">Instagram Media</h3>
              <p className="text-sm text-muted-foreground">Get images and videos from Instagram posts</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">🔗</div>
              <h3 className="font-semibold">Direct Links</h3>
              <p className="text-sm text-muted-foreground">Get direct URLs for easy downloading</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
