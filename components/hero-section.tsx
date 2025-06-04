"use client"

import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"

export function HeroSection() {
  const scrollToGenerator = () => {
    document.getElementById("meta-generator")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto text-center max-w-4xl">
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Boost Your{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SEO in Seconds
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate optimized meta titles and descriptions with AI, instantly. Perfect for websites, blogs, and landing
            pages.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button
              size="lg"
              onClick={scrollToGenerator}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Start Generating SEO Tags
              <ArrowDown className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-sm text-muted-foreground">Free • No signup required • 3 generations included</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">⚡</div>
              <h3 className="font-semibold">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">Generate optimized meta tags in under 3 seconds</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">🎯</div>
              <h3 className="font-semibold">SEO Optimized</h3>
              <p className="text-sm text-muted-foreground">Perfect character counts and keyword optimization</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">📱</div>
              <h3 className="font-semibold">Mobile Friendly</h3>
              <p className="text-sm text-muted-foreground">Works perfectly on all devices and screen sizes</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
