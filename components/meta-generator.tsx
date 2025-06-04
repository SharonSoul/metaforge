"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, RefreshCw, Sparkles, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateMetaTags } from "@/app/actions/generate-meta"

interface GeneratedMeta {
  title: string
  description: string
}

export function MetaGenerator() {
  const [inputType, setInputType] = useState<"url" | "manual">("manual")
  const [url, setUrl] = useState("")
  const [content, setContent] = useState("")
  const [keyword, setKeyword] = useState("")
  const [tone, setTone] = useState("professional")
  const [pageType, setPageType] = useState("blog")
  const [generatedMeta, setGeneratedMeta] = useState<GeneratedMeta | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationsUsed, setGenerationsUsed] = useState(0)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (generationsUsed >= 3) {
      toast({
        title: "Generation limit reached",
        description: "Sign up to continue generating meta tags!",
        variant: "destructive",
      })
      return
    }

    if (!content.trim() && !url.trim()) {
      toast({
        title: "Input required",
        description: "Please provide either a URL or content description.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const result = await generateMetaTags({
        inputType,
        content: inputType === "url" ? url : content,
        keyword,
        tone,
        pageType,
      })

      if (result.success && result.data) {
        setGeneratedMeta(result.data)
        setGenerationsUsed((prev) => prev + 1)
        toast({
          title: "Meta tags generated!",
          description: "Your SEO-optimized meta tags are ready.",
        })
      } else {
        throw new Error(result.error || "Failed to generate meta tags")
      }
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Please try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard.`,
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please try selecting and copying manually.",
        variant: "destructive",
      })
    }
  }

  const exportResults = () => {
    if (!generatedMeta) return

    const content = `Meta Title: ${generatedMeta.title}\nMeta Description: ${generatedMeta.description}`
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "meta-tags.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section id="meta-generator" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">AI Meta Tag Generator</h2>
          <p className="text-muted-foreground">Generate SEO-optimized meta titles and descriptions in seconds</p>
          <div className="mt-4 text-sm text-muted-foreground">Generations used: {generationsUsed}/3 (free)</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={inputType} onValueChange={(value) => setInputType(value as "url" | "manual")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Manual Input</TabsTrigger>
                  <TabsTrigger value="url">URL Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4">
                  <div>
                    <Label htmlFor="content">Page Content/Topic</Label>
                    <Textarea
                      id="content"
                      placeholder="Describe your page content, topic, or what it's about..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pageType">Page Type</Label>
                    <Select value={pageType} onValueChange={setPageType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blog">Blog Post</SelectItem>
                        <SelectItem value="product">Product Page</SelectItem>
                        <SelectItem value="homepage">Homepage</SelectItem>
                        <SelectItem value="landing">Landing Page</SelectItem>
                        <SelectItem value="about">About Page</SelectItem>
                        <SelectItem value="service">Service Page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                  <div>
                    <Label htmlFor="url">Website URL</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com/page"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div>
                <Label htmlFor="keyword">Focus Keyword (Optional)</Label>
                <Input
                  id="keyword"
                  placeholder="e.g., SEO tools, web development"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="tone">Tone & Style</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="persuasive">Persuasive</SelectItem>
                    <SelectItem value="informational">Informational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || generationsUsed >= 3}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Meta Tags
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Meta Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {generatedMeta ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Meta Title</Label>
                      <span
                        className={`text-xs ${generatedMeta.title.length > 60 ? "text-red-500" : "text-green-500"}`}
                      >
                        {generatedMeta.title.length}/60 chars
                      </span>
                    </div>
                    <div className="relative">
                      <Textarea value={generatedMeta.title} readOnly className="pr-10 min-h-[60px]" />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(generatedMeta.title, "Meta title")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Meta Description</Label>
                      <span
                        className={`text-xs ${generatedMeta.description.length > 160 ? "text-red-500" : "text-green-500"}`}
                      >
                        {generatedMeta.description.length}/160 chars
                      </span>
                    </div>
                    <div className="relative">
                      <Textarea value={generatedMeta.description} readOnly className="pr-10 min-h-[100px]" />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(generatedMeta.description, "Meta description")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleGenerate}
                      disabled={isGenerating || generationsUsed >= 3}
                      className="flex-1"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                    <Button variant="outline" onClick={exportResults}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Your generated meta tags will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
