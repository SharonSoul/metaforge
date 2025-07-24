"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, ExternalLink, AlertCircle, CheckCircle, Loader2, Copy, Info, FileVideo, ImageIcon, PlayCircle } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { extractMedia } from "@/app/actions/extract-media"

interface MediaResult {
  type: string
  url: string
  thumbnail?: string
  title?: string
  author?: string
  duration?: string
  quality?: string
  fileSize?: string
}

export function MediaDownloader() {
  const [platform, setPlatform] = useState<"instagram" | "tiktok">("tiktok")
  const [mediaType, setMediaType] = useState("video")
  const [url, setUrl] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
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
        description: "Please enter a valid Instagram or TikTok URL",
        variant: "destructive",
      })
      return
    }

    // Basic URL validation
    const isValidInstagramUrl = url.includes("instagram.com")
    const isValidTikTokUrl =
      url.includes("tiktok.com") || url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com")

    if (platform === "instagram" && !isValidInstagramUrl) {
      setError("Please enter a valid Instagram URL")
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Instagram URL",
        variant: "destructive",
      })
      return
    }

    if (platform === "tiktok" && !isValidTikTokUrl) {
      setError("Please enter a valid TikTok URL")
      toast({
        title: "Invalid URL",
        description: "Please enter a valid TikTok URL",
        variant: "destructive",
      })
      return
    }

    setIsExtracting(true)

    try {
      const extractResult = await extractMedia({
        platform,
        url,
        mediaType,
      })

      if (extractResult.success && extractResult.data) {
        setResult(extractResult.data)
        toast({
          title: "Media Extracted Successfully!",
          description: `${extractResult.data.quality || "Standard"} quality ${extractResult.data.type} is ready`,
        })
      } else {
        throw new Error(extractResult.error || "Failed to extract media")
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
      setIsExtracting(false)
    }
  }

  const handleDownload = async (downloadUrl: string, filename: string) => {
    try {
      setIsDownloading(true)

      toast({
        title: "Processing Download",
        description: "Fetching and validating the media file...",
      })

      const response = await fetch("/api/download-media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: downloadUrl,
          filename: filename,
          platform: platform,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const fileSizeMB = (blob.size / 1024 / 1024).toFixed(2)

        console.log("Downloaded blob size:", blob.size, "bytes")

        if (blob.size < 1024 * 100) {
          toast({
            title: "Warning: Small File",
            description: `File is only ${Math.round(blob.size / 1024)}KB. This might not be the full ${result?.type || "media"}.`,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Download Successful",
            description: `Downloaded ${fileSizeMB}MB ${result?.type || "media"} file`,
          })
        }

        // Create download link
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = blobUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)

        return
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("Download failed:", errorData)

        if (errorData.details) {
          toast({
            title: "Download Failed",
            description: errorData.details,
            variant: "destructive",
          })
        } else {
          throw new Error(errorData.error || "Download failed")
        }
      }
    } catch (error) {
      console.error("Download error:", error)

      // Fallback: open in new tab
      toast({
        title: "Download Failed - Opening Media",
        description: "Right-click and save the media file manually",
        variant: "destructive",
        duration: 8000,
      })

      window.open(downloadUrl, "_blank")
    } finally {
      setIsDownloading(false)
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
      toast({
        title: "Copy Failed",
        description: "Please copy the URL manually",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setUrl("")
    setResult(null)
    setError(null)
  }

  const getPlaceholderText = () => {
    if (platform === "instagram") {
      switch (mediaType) {
        case "video":
          return "https://www.instagram.com/p/ABC123xyz/"
        case "image":
          return "https://www.instagram.com/p/ABC123xyz/"
        case "story":
          return "https://www.instagram.com/stories/username/123456789/"
        case "profile":
          return "https://www.instagram.com/username/"
        default:
          return "https://www.instagram.com/p/ABC123xyz/"
      }
    } else {
      return "https://www.tiktok.com/@username/video/1234567890123456789"
    }
  }

  const getInstructions = () => {
    if (platform === "instagram") {
      return [
        "Go to Instagram and find the post you want to download",
        "Copy the post URL from your browser or share button",
        "Paste the URL in the input field above",
        "Select the media type and click 'Extract Media'",
      ]
    } else {
      return [
        "Go to TikTok and find the video you want to download",
        "Copy the video URL from share button or browser",
        "Paste the URL in the input field above",
        "Click 'Extract Media' to get the download link",
      ]
    }
  }

  return (
    <section id="media-downloader" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Professional Social Media Downloader</h2>
          <p className="text-muted-foreground">
            Download videos and images from Instagram and TikTok using reliable third-party services
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

              {/* Platform Selection */}
              <Tabs value={platform} onValueChange={(value) => setPlatform(value as "instagram" | "tiktok")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="instagram" className="flex items-center gap-2">
                    📷 Instagram
                  </TabsTrigger>
                  <TabsTrigger value="tiktok" className="flex items-center gap-2">
                    🎵 TikTok
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="instagram" className="space-y-4">
                  <div>
                    <Label>Media Type</Label>
                    <Tabs value={mediaType} onValueChange={setMediaType}>
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="video">Videos</TabsTrigger>
                        <TabsTrigger value="image">Images</TabsTrigger>
                        <TabsTrigger value="story">Stories</TabsTrigger>
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </TabsContent>

                <TabsContent value="tiktok" className="space-y-4">
                  <div>
                    <Label>Media Type</Label>
                    <Tabs value={mediaType} onValueChange={setMediaType}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="video">Videos</TabsTrigger>
                        <TabsTrigger value="audio">Audio Only</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </TabsContent>
              </Tabs>

              <div>
                <Label htmlFor="url">{platform === "instagram" ? "Instagram" : "TikTok"} URL *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder={getPlaceholderText()}
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    setError(null)
                  }}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Paste the complete URL from {platform === "instagram" ? "Instagram" : "TikTok"}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleExtract} disabled={isExtracting} className="flex-1" size="lg">
                  {isExtracting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Extract Media
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetForm} disabled={isExtracting}>
                  Reset
                </Button>
              </div>

              {/* Instructions */}
              <div className="text-xs text-muted-foreground space-y-2 p-3 bg-muted/50 rounded-md">
                <p className="font-medium">How to extract from {platform === "instagram" ? "Instagram" : "TikTok"}:</p>
                <ol className="space-y-1 ml-4">
                  {getInstructions().map((instruction, index) => (
                    <li key={index}>
                      {index + 1}. {instruction}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Enhanced Info */}
              <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-md text-sm">
                <Info className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-green-800 dark:text-green-200">
                  <p className="font-medium">Professional Service:</p>
                  <p className="text-xs mt-1">
                    Uses TikWM API and reliable third-party services for consistent downloads with HD quality support.
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
                    <span className="font-medium">Media Successfully Extracted</span>
                  </div>

                  {result.thumbnail && (
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                      <img
                        src={result.thumbnail || "/placeholder.svg"}
                        alt="Media thumbnail"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=400&width=400&text=Media+Preview"
                        }}
                      />
                      {result.type === "video" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <PlayCircle className="h-12 w-12 text-white/80" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    {result.title && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Title</Label>
                        <p className="text-sm line-clamp-2">{result.title}</p>
                      </div>
                    )}
                    {result.author && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Author</Label>
                        <p className="text-sm">@{result.author}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {result.duration && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Duration</Label>
                          <p className="text-sm">{result.duration}</p>
                        </div>
                      )}
                      {result.quality && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Quality</Label>
                          <p className="text-sm font-medium text-green-600">{result.quality}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Media URL</Label>
                      <div className="flex items-center gap-2">
                        <Input value={result.url} readOnly className="text-xs" />
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(result.url)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md text-sm">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-blue-800 dark:text-blue-200">
                      <p className="font-medium">Professional Download:</p>
                      <p className="text-xs mt-1">
                        Click "Download {result.type === "audio" ? "Audio" : "Video"}" to process and download the actual file with validation.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        handleDownload(
                          result.url,
                          `${platform}_${result.quality?.replace(/\s+/g, "_") || "media"}_${Date.now()}.${
                            result.type === "audio" ? "mp3" : result.type === "video" ? "mp4" : "jpg"
                          }`,
                        )
                      }
                      disabled={isDownloading}
                      className="flex-1"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download {result.type === "audio" ? "Audio" : "Video"}
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => window.open(result.url, "_blank")}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="flex justify-center mb-4">
                    <FileVideo className="h-8 w-8 mr-2 opacity-50" />
                    <ImageIcon className="h-8 w-8 opacity-50" />
                  </div>
                  <p>Your extracted media will appear here</p>
                  <p className="text-sm mt-2">Enter a URL and click "Extract Media" to start</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl mb-2">🔧</div>
              <h3 className="font-semibold mb-2">TikWM API Service</h3>
              <p className="text-sm text-muted-foreground">Professional TikTok downloader API</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl mb-2">📋</div>
              <h3 className="font-semibold mb-2">Meta Tag Extraction</h3>
              <p className="text-sm text-muted-foreground">Fallback to HTML meta tag parsing</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold mb-2">HD Quality Support</h3>
              <p className="text-sm text-muted-foreground">Automatically requests highest quality</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl mb-2">✅</div>
              <h3 className="font-semibold mb-2">File Validation</h3>
              <p className="text-sm text-muted-foreground">Ensures proper media files are downloaded</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
