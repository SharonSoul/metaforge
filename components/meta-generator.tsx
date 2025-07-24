"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, RefreshCw, Sparkles, Download, AlertCircle } from "lucide-react"
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
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    setError(null)

    if (generationsUsed >= 3) {
      toast({
        title: "Generation limit reached",
        description: "Sign up to continue generating meta tags!",
        variant: "destructive",
      })
      return
    }

    const currentInput = inputType === "url" ? url.trim() : content.trim()

    if (!currentInput) {
      setError("Please provide either a URL or content description.")
      toast({
        title: "Input required",
        description: "Please provide either a URL or content description.",
        variant: "destructive",
      })
      return
    }

    // Basic URL validation if URL input is selected
    if (inputType === "url" && !isValidUrl(url)) {
      setError("Please enter a valid URL (e.g., https://example.com)")
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const result = await generateMetaTags({
        inputType,
        content: currentInput,
        keyword: keyword.trim(),
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
      const errorMessage = error instanceof Error ? error.message : "Please try again in a moment."
      setError(errorMessage)
      toast({
        title: "Generation failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
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
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        toast({
          title: "Copied!",
          description: `${type} copied to clipboard.`,
        })
      } catch (fallbackError) {
        toast({
          title: "Copy failed",
          description: "Please try selecting and copying manually.",
          variant: "destructive",
        })
      }
      document.body.removeChild(textArea)
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
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Exported!",
      description: "Meta tags exported to meta-tags.txt",
    })
  }

  const resetForm = () => {
    setUrl("")
    setContent("")
    setKeyword("")
    setTone("professional")
    setPageType("blog")
    setGeneratedMeta(null)
    setError(null)
  }

  return (
    <section id="meta-generator" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">AI Meta Tag Generator</h2>
          <p className="text-muted-foreground">Generate SEO-optimized meta titles and descriptions in seconds</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Generations used: {generationsUsed}/3 (free)</span>
            {generationsUsed >= 3 && (
              <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">Limit reached</span>
            )}
          </div>
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
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Tabs
                value={inputType}
                onValueChange={(value) => {
                  setInputType(value as "url" | "manual")
                  setError(null)
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Manual Input</TabsTrigger>
                  <TabsTrigger value="url">URL Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4">
                  <div>
                    <Label htmlFor="content">Page Content/Topic *</Label>
                    <Textarea
                      id="content"
                      placeholder="Describe your page content, topic, or what it's about..."
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value)
                        setError(null)
                      }}
                      className="min-h-[100px]"
                      maxLength={1000}
                    />
                    <div className="text-xs text-muted-foreground mt-1">{content.length}/1000 characters</div>
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
                    <Label htmlFor="url">Website URL *</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com/page"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value)
                        setError(null)
                      }}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Enter a complete URL starting with http:// or https://
                    </div>
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
                  maxLength={100}
                />
                <div className="text-xs text-muted-foreground mt-1">{keyword.length}/100 characters</div>
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

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || generationsUsed >= 3}
                  className="flex-1"
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
                <Button variant="outline" onClick={resetForm} disabled={isGenerating}>
                  Reset
                </Button>
              </div>
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
                  <p className="text-sm mt-2">Fill in the form and click "Generate Meta Tags" to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
