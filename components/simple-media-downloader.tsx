"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, ExternalLink, AlertCircle, CheckCircle, Loader2, Copy, Info } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface MediaResult {
  type: string
  url: string
  thumbnail?: string
  title?: string
  quality?: string
}

export function SimpleMediaDownloader() {
  const [url, setUrl] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<MediaResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleExtract = async () => {
    setError(null)
    setResult(null)

    if (!url.trim()) {
      setError("Please enter a valid URL")
      toast({
        title: "URL Required",
        description: "Please enter a valid social media URL",
        variant: "destructive",
      })
      return
    }

    // Basic URL validation
    const isValidUrl = url.includes("tiktok.com") || url.includes("instagram.com") || 
                      url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com")

    if (!isValidUrl) {
      setError("Please enter a valid TikTok or Instagram URL")
      toast({
        title: "Invalid URL",
        description: "Please enter a valid TikTok or Instagram URL",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Call our simple extraction API
      const response = await fetch("/api/simple-extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult(data.data)
        toast({
          title: "Media Found!",
          description: `Successfully extracted ${data.data.type}`,
        })
      } else {
        throw new Error(data.error || "Failed to extract media")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to extract media"
      setError(errorMessage)
      toast({
        title: "Extraction Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = async (downloadUrl: string) => {
    try {
      toast({
        title: "Starting Download",
        description: "Opening media in new tab for download...",
      })

      // Simple approach - just open the URL
      window.open(downloadUrl, "_blank")
      
      toast({
        title: "Download Started",
        description: "Right-click and save the media file",
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Please try copying the URL manually",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "Media URL copied to clipboard",
      })
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      
      toast({
        title: "Copied!",
        description: "Media URL copied to clipboard",
      })
    }
  }

  const resetForm = () => {
    setUrl("")
    setResult(null)
    setError(null)
  }

  return (
    <section id="media-downloader" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Simple Social Media Downloader</h2>
          <p className="text-muted-foreground">
            Extract media URLs from TikTok and Instagram posts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Extract Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="url">Social Media URL *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://www.tiktok.com/@user/video/123... or https://www.instagram.com/p/ABC..."
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    setError(null)
                  }}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Paste any TikTok or Instagram URL
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleExtract} disabled={isProcessing} className="flex-1" size="lg">
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Extract Media
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetForm} disabled={isProcessing}>
                  Reset
                </Button>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md text-sm">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-blue-800 dark:text-blue-200">
                  <p className="font-medium">How it works:</p>
                  <p className="text-xs mt-1">
                    1. Paste a TikTok or Instagram URL<br/>
                    2. Click "Extract Media" to find the video/image<br/>
                    3. Use the direct link to download or view the media
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Result Section */}
          <Card>
            <CardHeader>
              <CardTitle>Extraction Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {result ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Media Successfully Found</span>
                  </div>

                  {result.thumbnail && (
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <img
                        src={result.thumbnail || "/placeholder.svg"}
                        alt="Media preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=400&width=400&text=Media+Preview"
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    {result.title && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Title</Label>
                        <p className="text-sm">{result.title}</p>
                      </div>
                    )}
                    {result.quality && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Quality</Label>
                        <p className="text-sm font-medium text-green-600">{result.quality}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-muted-foreground">Direct Media URL</Label>
                      <div className="flex items-center gap-2">
                        <Input value={result.url} readOnly className="text-xs" />
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(result.url)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDownload(result.url)}
                      className="flex-1"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Open Media
                    </Button>
                    <Button variant="outline" onClick={() => window.open(result.url, "_blank")}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Your extracted media will appear here</p>
                  <p className="text-sm mt-2">Enter a URL and click "Extract Media" to start</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
