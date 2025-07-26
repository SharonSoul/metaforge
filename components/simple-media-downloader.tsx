"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, ExternalLink, AlertCircle, CheckCircle, Loader2, Copy, Info, Archive, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MediaResult {
  type: string
  url: string
  thumbnail?: string
  title?: string
  quality?: string
  images?: string[] // For carousel posts
  duration?: string
  author?: string
}

export function SimpleMediaDownloader() {
  const [platform, setPlatform] = useState<"tiktok" | "instagram">("tiktok")
  const [instagramMediaType, setInstagramMediaType] = useState("reels")
  const [url, setUrl] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<MediaResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const { toast } = useToast()

  // Clear input and results when switching between main platforms
  const handlePlatformChange = (newPlatform: "tiktok" | "instagram") => {
    if (newPlatform !== platform) {
      setPlatform(newPlatform)
      setUrl("")
      setResult(null)
      setError(null)
    }
  }

  const handleExtract = async () => {
    setError(null)
    setResult(null)

    if (!url.trim()) {
      setError("Please enter a valid URL")
      toast({
        title: "URL Required",
        description: `Please enter a valid ${platform === "tiktok" ? "TikTok" : "Instagram"} URL`,
        variant: "destructive",
      })
      return
    }

    // Platform-specific URL validation
    let isValidUrl = false
    if (platform === "tiktok") {
      isValidUrl = url.includes("tiktok.com") || url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com")
    } else {
      isValidUrl = url.includes("instagram.com")
    }

    if (!isValidUrl) {
      setError(`Please enter a valid ${platform === "tiktok" ? "TikTok" : "Instagram"} URL`)
      toast({
        title: "Invalid URL",
        description: `Please enter a valid ${platform === "tiktok" ? "TikTok" : "Instagram"} URL`,
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Special handling for Instagram Reels
      if (platform === "instagram" && instagramMediaType === "reels" && url.includes("/reel/")) {
        console.log("Using dedicated Instagram Reel API endpoint")
        
        const response = await fetch("/api/fetch-reel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        })

        const data = await response.json()

        if (data.success && data.url) {
          const result: MediaResult = {
            type: "video",
            url: data.url,
            thumbnail: data.thumbnail,
            title: data.title || "Instagram Reel",
            quality: data.quality || "High Quality",
            duration: data.duration ? `${data.duration}s` : undefined,
          }
          
          setResult(result)
          toast({
            title: "Instagram Reel Extracted Successfully!",
            description: `${data.quality || "High Quality"} video is ready for download`,
          })
          
          // Smooth scroll to result section
          setTimeout(() => {
            const resultSection = document.getElementById("extraction-result")
            if (resultSection) {
              resultSection.scrollIntoView({ 
                behavior: "smooth", 
                block: "start",
                inline: "nearest"
              })
            }
          }, 100)
        } else {
          throw new Error(data.error || "Failed to extract Instagram Reel")
        }
      } else {
        // Use existing simple-extract API for other content
        const response = await fetch("/api/simple-extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            platform,
            mediaType: platform === "instagram" ? instagramMediaType : "video",
          }),
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setResult(data.data)
          const mediaCount = data.data.images ? data.data.images.length : 1
          const mediaTypeText = data.data.type === "reel" ? "Reel" : data.data.type
          toast({
            title: "Media Found!",
            description: `Successfully extracted ${mediaCount} ${mediaTypeText}${mediaCount > 1 ? "s" : ""} from ${platform}`,
          })
          
          // Smooth scroll to result section
          setTimeout(() => {
            const resultSection = document.getElementById("extraction-result")
            if (resultSection) {
              resultSection.scrollIntoView({ 
                behavior: "smooth", 
                block: "start",
                inline: "nearest"
              })
            }
          }, 100)
        } else {
          throw new Error(data.error || "Failed to extract media")
        }
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

  const handleDownloadSingle = async (downloadUrl: string, index?: number) => {
    try {
      if (index !== undefined) {
        setDownloadingIndex(index)
      }

      toast({
        title: "Downloading Media",
        description: "Fetching and downloading the media file...",
      })

      // Fetch the video/image file
      const response = await fetch(downloadUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.status}`)
      }

      const blob = await response.blob()
      const fileSizeMB = (blob.size / 1024 / 1024).toFixed(2)

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      
      // Generate filename based on result title and type
      let filename = ""
      if (result?.images && index !== undefined) {
        // Carousel image
        filename = result?.title 
          ? `${result.title.replace(/[^a-zA-Z0-9]/g, "_")}_${index + 1}.jpg`
          : `instagram_carousel_${index + 1}_${Date.now()}.jpg`
      } else {
        // Single video/image
        const isVideo = result?.type === "video" || result?.type === "reel"
        const extension = isVideo ? "mp4" : "jpg"
        filename = result?.title 
          ? `${result.title.replace(/[^a-zA-Z0-9]/g, "_")}.${extension}`
          : `instagram_${result?.type || "media"}_${Date.now()}.${extension}`
      }
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Download Complete!",
        description: `Media downloaded successfully (${fileSizeMB}MB)`,
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download media. Please try copying the URL manually.",
        variant: "destructive",
      })
    } finally {
      if (index !== undefined) {
        setDownloadingIndex(null)
      }
    }
  }

  const handleDownloadAll = async () => {
    if (!result?.images || result.images.length === 0) return

    setDownloadingAll(true)

    try {
      toast({
        title: "Starting Downloads",
        description: `Downloading ${result.images.length} images one by one...`,
      })

      // Download all images one by one automatically
      for (let i = 0; i < result.images.length; i++) {
        const imageUrl = result.images[i]
        
        try {
          // Fetch the image
          const response = await fetch(imageUrl)
          if (!response.ok) {
            throw new Error(`Failed to fetch image ${i + 1}: ${response.status}`)
          }

          const blob = await response.blob()
          const fileSizeMB = (blob.size / 1024 / 1024).toFixed(2)

          // Create download link
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          
          // Generate filename based on result title and image number
          const filename = result?.title 
            ? `${result.title.replace(/[^a-zA-Z0-9]/g, "_")}_${i + 1}.jpg`
            : `instagram_carousel_${i + 1}_${Date.now()}.jpg`
          
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)

          // Small delay between downloads to avoid overwhelming the browser
          if (i < result.images.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        } catch (error) {
          console.error(`Failed to download image ${i + 1}:`, error)
          // Continue with next image even if one fails
        }
      }

      toast({
        title: "All Downloads Complete!",
        description: `Successfully downloaded ${result.images.length} images`,
      })
    } catch (error) {
      console.error("Download all error:", error)
      toast({
        title: "Download Failed",
        description: "Some images failed to download. Try downloading individually.",
        variant: "destructive",
      })
    } finally {
      setDownloadingAll(false)
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

  const getPlaceholderText = () => {
    if (platform === "tiktok") {
      return "https://www.tiktok.com/@username/video/1234567890123456789"
    } else {
      switch (instagramMediaType) {
        case "reels":
          return "https://www.instagram.com/reel/ABC123xyz/ or https://www.instagram.com/p/ABC123xyz/"
        case "images":
          return "https://www.instagram.com/p/ABC123xyz/ (image post)"
        case "stories":
          return "https://www.instagram.com/stories/username/123456789/"
        case "carousels":
          return "https://www.instagram.com/p/ABC123xyz/ (carousel post with multiple images)"
        default:
          return "https://www.instagram.com/p/ABC123xyz/"
      }
    }
  }

  const getInstructions = () => {
    if (platform === "tiktok") {
      return [
        "Go to TikTok and find the video you want to download",
        "Copy the video URL from share button or browser address bar",
        "Paste the URL in the input field above",
        "Click 'Extract Media' to get the direct video link",
      ]
    } else {
      const mediaTypeText =
        instagramMediaType === "reels"
          ? "Reel"
          : instagramMediaType === "images"
            ? "image"
            : instagramMediaType === "stories"
              ? "story"
              : instagramMediaType === "carousels"
                ? "carousel post (multiple images)"
                : "video"
      return [
        `Go to Instagram and find the ${mediaTypeText} you want to download`,
        "Copy the URL from your browser address bar or share button",
        "Paste the URL in the input field above",
        "Click 'Extract Media' to get the direct media link(s)",
      ]
    }
  }

  return (
    <section id="media-downloader" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Social Media Downloader</h2>
          <p className="text-muted-foreground">Extract direct links to videos and images from TikTok and Instagram</p>
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

              {/* Platform Selection */}
              <Tabs value={platform} onValueChange={(value) => handlePlatformChange(value as "tiktok" | "instagram")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tiktok" className="flex items-center gap-2">
                    🎵 TikTok
                  </TabsTrigger>
                  <TabsTrigger value="instagram" className="flex items-center gap-2">
                    📷 Instagram
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tiktok" className="space-y-4">
                  <div>
                    <Label htmlFor="tiktok-url">TikTok Video URL *</Label>
                    <Input
                      id="tiktok-url"
                      type="url"
                      placeholder={getPlaceholderText()}
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value)
                        setError(null)
                      }}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Paste any TikTok video URL (including short links)
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="instagram" className="space-y-4">
                  <div>
                    <Label>Instagram Media Type</Label>
                    <Tabs value={instagramMediaType} onValueChange={setInstagramMediaType}>
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="reels" className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          Reels
                        </TabsTrigger>
                        <TabsTrigger value="images">Images</TabsTrigger>
                        <TabsTrigger value="stories">Stories</TabsTrigger>
                        <TabsTrigger value="carousels">Carousels</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div>
                    <Label htmlFor="instagram-url">Instagram URL *</Label>
                    <Input
                      id="instagram-url"
                      type="url"
                      placeholder={getPlaceholderText()}
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value)
                        setError(null)
                      }}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Paste the Instagram{" "}
                      {instagramMediaType === "reels"
                        ? "Reel"
                        : instagramMediaType === "images"
                          ? "image"
                          : instagramMediaType === "stories"
                            ? "story"
                            : instagramMediaType === "carousels"
                              ? "carousel"
                              : "video"}{" "}
                      URL
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

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

              {/* Instructions */}
              <div className="text-xs text-muted-foreground space-y-2 p-3 bg-muted/50 rounded-md">
                <p className="font-medium">How to extract from {platform === "tiktok" ? "TikTok" : "Instagram"}:</p>
                <ol className="space-y-1 ml-4">
                  {getInstructions().map((instruction, index) => (
                    <li key={index}>
                      {index + 1}. {instruction}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md text-sm">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Current Platform: {platform === "tiktok" ? "TikTok" : "Instagram"}</p>
                  <p className="text-xs mt-1">
                    {platform === "tiktok"
                      ? "Uses TikWM API for reliable HD video extraction"
                      : `Extracting ${instagramMediaType} using advanced HTML parsing`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Result Section */}
          <Card id="extraction-result">
            <CardHeader>
              <CardTitle>Extraction Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {result ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">
                      {result.images ? `${result.images.length} Images` : result.type === "reel" ? "Reel" : "Media"}{" "}
                      Successfully Found
                    </span>
                  </div>

                  {result.title && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Title</Label>
                      <p className="text-sm line-clamp-2">{result.title}</p>
                    </div>
                  )}

                  {/* Single Media (Video/Reel/Single Image) */}
                  {!result.images && result.thumbnail && (
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                      <img
                        src={result.thumbnail || "/placeholder.svg"}
                        alt="Media preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=400&width=400&text=Media+Preview"
                        }}
                      />
                      {(result.type === "reel" || result.type === "video") && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/50 rounded-full p-3">
                            <Play className="h-8 w-8 text-white fill-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Carousel Images */}
                  {result.images && result.images.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Carousel Images ({result.images.length})</Label>
                        <Button onClick={handleDownloadAll} disabled={downloadingAll} variant="outline" size="sm">
                          {downloadingAll ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Downloading All...
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-3 w-3" />
                              Download All ({result.images.length})
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                        {result.images.map((imageUrl, index) => (
                          <div key={index} className="border rounded-lg p-3 space-y-3">
                            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                              <img
                                src={imageUrl || "/placeholder.svg"}
                                alt={`Carousel image ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg?height=300&width=300&text=Image+" + (index + 1)
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground flex-1">
                                Image {index + 1} of {result.images!.length}
                              </span>
                              <Button
                                onClick={() => handleDownloadSingle(imageUrl, index)}
                                disabled={downloadingIndex === index}
                                size="sm"
                                variant="outline"
                              >
                                {downloadingIndex === index ? (
                                  <>
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    Downloading...
                                  </>
                                ) : (
                                  <>
                                    <Download className="mr-1 h-3 w-3" />
                                    Download
                                  </>
                                )}
                              </Button>
                              <Button onClick={() => copyToClipboard(imageUrl)} size="sm" variant="ghost">
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Single Media Controls */}
                  {!result.images && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Type</Label>
                          <p className="text-sm font-medium capitalize">
                            {result.type === "reel" ? "Instagram Reel" : result.type}
                          </p>
                        </div>
                        {result.quality && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Quality</Label>
                            <p className="text-sm font-medium text-green-600">{result.quality}</p>
                          </div>
                        )}
                      </div>

                      {result.author && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Author</Label>
                          <p className="text-sm">@{result.author}</p>
                        </div>
                      )}

                      {result.duration && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Duration</Label>
                          <p className="text-sm">{result.duration}</p>
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

                      <div className="flex gap-2">
                        <Button onClick={() => handleDownloadSingle(result.url)} className="flex-1">
                          <Download className="mr-2 h-4 w-4" />
                          Download {result.type === "reel" ? "Reel" : result.type}
                        </Button>
                        <Button variant="outline" onClick={() => window.open(result.url, "_blank")}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Your extracted media will appear here</p>
                  <p className="text-sm mt-2">
                    Select {platform === "tiktok" ? "TikTok" : "Instagram"} and enter a URL to start
                  </p>
                  {platform === "instagram" && (
                    <p className="text-xs mt-1 text-muted-foreground/70">
                      Currently set to extract: {instagramMediaType === "reels" ? "Reels" : instagramMediaType}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl mb-2">🎵</div>
              <h3 className="font-semibold mb-2">TikTok Videos</h3>
              <p className="text-sm text-muted-foreground">HD quality extraction using TikWM API</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl mb-2">🎬</div>
              <h3 className="font-semibold mb-2">Instagram Reels</h3>
              <p className="text-sm text-muted-foreground">Extract high-quality Reels videos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl mb-2">🖼️</div>
              <h3 className="font-semibold mb-2">Images & Carousels</h3>
              <p className="text-sm text-muted-foreground">Single images and multi-image carousels</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl mb-2">📱</div>
              <h3 className="font-semibold mb-2">Stories Support</h3>
              <p className="text-sm text-muted-foreground">Extract Instagram Stories content</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
