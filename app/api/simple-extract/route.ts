import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url, platform, mediaType } = await request.json()

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: "URL is required",
        },
        { status: 400 },
      )
    }

    console.log("Processing URL:", url, "Platform:", platform, "Media Type:", mediaType)

    // Determine platform if not provided
    const detectedPlatform =
      platform ||
      (url.includes("tiktok.com") || url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com")
        ? "tiktok"
        : url.includes("instagram.com")
          ? "instagram"
          : null)

    if (!detectedPlatform) {
      return NextResponse.json(
        {
          success: false,
          error: "Only TikTok and Instagram URLs are supported",
        },
        { status: 400 },
      )
    }

    let result: { success: boolean; data?: any; error?: string }
    if (detectedPlatform === "tiktok") {
      result = await extractTikTok(url)
    } else {
      result = await extractInstagram(url, mediaType || "reels")
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Unknown error occurred",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Extraction error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

// Simple TikTok extraction using public API
async function extractTikTok(url: string) {
  try {
    // Clean the URL
    const cleanUrl = url.replace(/\?.*$/, "").replace(/\/$/, "")

    // Try TikWM API - simple POST request
    const apiResponse = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: `url=${encodeURIComponent(cleanUrl)}&hd=1`,
    })

    if (apiResponse.ok) {
      const data = await apiResponse.json()

      if (data.code === 0 && data.data) {
        const videoData = data.data
        const videoUrl = videoData.hdplay || videoData.play || videoData.wmplay

        if (videoUrl) {
          return {
            success: true,
            data: {
              type: "video",
              url: videoUrl,
              thumbnail: videoData.cover,
              title: videoData.title || "TikTok Video",
              quality: videoData.hdplay ? "HD" : "Standard",
              author: videoData.author?.unique_id,
              duration: videoData.duration ? `${videoData.duration}s` : undefined,
            },
          }
        }
      }
    }

    // Fallback: try to extract from HTML
    return await extractFromHTML(cleanUrl, "tiktok")
  } catch (error) {
    console.error("TikTok extraction error:", error)
    return {
      success: false,
      error: "Failed to extract TikTok video",
    }
  }
}

// Enhanced Instagram extraction with Python script for carousels
async function extractInstagram(url: string, mediaType = "reels") {
  try {
    const cleanUrl = url.replace(/\?.*$/, "").replace(/\/$/, "")

    // Validate Instagram URL format
    if (!cleanUrl.includes("instagram.com")) {
      throw new Error("Invalid Instagram URL")
    }

    if (mediaType === "reels") {
      return await extractInstagramReels(cleanUrl)
    } else if (mediaType === "carousels") {
      // Try Python script first (most reliable for carousels)
      console.log("Trying Python carousel scraper...")
      const pythonResult: { success: boolean; data?: any; error?: string } = await extractInstagramCarouselWithPython(cleanUrl)
      if (pythonResult.success) {
        return pythonResult
      }
      
      // Fallback to JavaScript methods
      console.log("Python scraper failed, trying JavaScript methods...")
      const jsResult = await extractInstagramCarousel(cleanUrl)
      if (jsResult.success) {
        return jsResult
      }
      
      // Try alternative JavaScript method
      console.log("Primary JavaScript method failed, trying alternative...")
      const alternativeResult = await extractInstagramCarouselAlternative(cleanUrl)
      if (alternativeResult.success) {
        return alternativeResult
      }
      
      // Final fallback to regular extraction
      console.log("All methods failed, trying regular extraction...")
      return await extractFromHTML(cleanUrl, "instagram", "images")
    } else {
      return await extractFromHTML(cleanUrl, "instagram", mediaType)
    }
  } catch (error) {
    console.error("Instagram extraction error:", error)
    return {
      success: false,
      error: `Failed to extract Instagram ${mediaType}: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// New function to use Python script for carousel extraction
async function extractInstagramCarouselWithPython(url: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { spawn } = require('child_process')
    
    console.log("Running Python carousel scraper for:", url)
    
    return new Promise((resolve) => {
      const pythonProcess = spawn('python', ['instagram_carousel_scraper.py', url])
      
      let output = ''
      let errorOutput = ''
      
      pythonProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString()
      })
      
      pythonProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString()
      })
      
      pythonProcess.on('close', (code: number) => {
        console.log(`Python process exited with code ${code}`)
        
        if (code === 0 && output.trim()) {
          try {
            // Find the JSON result in the output
            const jsonMatch = output.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const result = JSON.parse(jsonMatch[0])
              console.log("Python scraper result:", result)
              resolve(result)
            } else {
              console.log("No JSON found in Python output")
              resolve({
                success: false,
                error: "No valid result from Python scraper"
              })
            }
          } catch (parseError) {
            console.error("Failed to parse Python output:", parseError)
            resolve({
              success: false,
              error: "Failed to parse Python scraper result"
            })
          }
        } else {
          console.error("Python process failed:", errorOutput)
          resolve({
            success: false,
            error: `Python scraper failed: ${errorOutput}`
          })
        }
      })
      
      pythonProcess.on('error', (error: Error) => {
        console.error("Failed to start Python process:", error)
        resolve({
          success: false,
          error: `Failed to start Python process: ${error.message}`
        })
      })
    })
  } catch (error) {
    console.error("Python carousel extraction error:", error)
    return {
      success: false,
      error: `Python extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }
}

// New function to extract Instagram Reels
async function extractInstagramReels(url: string) {
  try {
    // Clean and normalize the URL
    const cleanUrl = url.replace(/\?.*$/, "").replace(/\/$/, "")

    console.log("Extracting Reel from:", cleanUrl)

    // Enhanced headers for Instagram Reels
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      DNT: "1",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Cache-Control": "max-age=0",
      Referer: "https://www.instagram.com/",
    }

    let response = await fetch(cleanUrl, {
      headers,
      redirect: "follow",
    })

    // Handle redirects manually if needed
    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get("location")
      if (location) {
        console.log("Following redirect to:", location)
        const redirectUrl = location.startsWith("http") ? location : `https://www.instagram.com${location}`
        response = await fetch(redirectUrl, {
          headers,
          redirect: "follow",
        })
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    console.log("HTML length:", html.length)

    // Extract basic info
    const titleMatch =
      html.match(/<meta property="og:title" content="([^"]+)"/) || html.match(/<title>([^<]+)<\/title>/)
    const title = titleMatch?.[1]?.replace(/"/g, "") || "Instagram Reel"

    // Extract author from title or description
    const authorMatch = title.match(/@([a-zA-Z0-9_.]+)/) || html.match(/"owner":\s*{\s*"username":\s*"([^"]+)"/)
    const author = authorMatch?.[1]

    // Method 1: Look for video URL in meta tags
    const videoUrlMatch =
      html.match(/<meta property="og:video:secure_url" content="([^"]+)"/) ||
      html.match(/<meta property="og:video" content="([^"]+)"/)

    const thumbnailMatch = html.match(/<meta property="og:image" content="([^"]+)"/)

    if (videoUrlMatch) {
      const videoUrl = videoUrlMatch[1]
      console.log("Found video URL in meta tags:", videoUrl)

      return {
        success: true,
        data: {
          type: "reel",
          url: videoUrl,
          thumbnail: thumbnailMatch?.[1],
          title: title,
          author: author,
          quality: "Standard",
        },
      }
    }

    // Method 2: Extract from window._sharedData or similar
    const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});/)
    if (sharedDataMatch) {
      try {
        const sharedData = JSON.parse(sharedDataMatch[1])
        const entryData = sharedData?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media

        if (entryData?.video_url) {
          console.log("Found video URL in shared data:", entryData.video_url)

          return {
            success: true,
            data: {
              type: "reel",
              url: entryData.video_url,
              thumbnail: entryData.display_url,
              title: entryData.edge_media_to_caption?.edges?.[0]?.node?.text || title,
              author: entryData.owner?.username || author,
              quality: "Standard",
              duration: entryData.video_duration ? `${Math.round(entryData.video_duration)}s` : undefined,
            },
          }
        }
      } catch (e) {
        console.log("Failed to parse shared data:", e)
      }
    }

    // Method 3: Look for video URLs in script content
    const videoPatterns = [
      /"video_url"\s*:\s*"([^"]+)"/g,
      /"playback_url"\s*:\s*"([^"]+)"/g,
      /"src"\s*:\s*"([^"]*\.mp4[^"]*)"/g,
      /https:\/\/[^"'\s]*\.mp4[^"'\s]*/g,
    ]

    for (const pattern of videoPatterns) {
      const matches = html.matchAll(pattern)
      for (const match of matches) {
        let videoUrl = match[1] || match[0]

        // Clean up escaped characters
        videoUrl = videoUrl.replace(/\\u0026/g, "&").replace(/\\/g, "")

        // Validate it's a proper video URL
        if (videoUrl.includes(".mp4") && (videoUrl.includes("scontent") || videoUrl.includes("instagram"))) {
          try {
            new URL(videoUrl)
            console.log("Found video URL with pattern matching:", videoUrl)

            return {
              success: true,
              data: {
                type: "reel",
                url: videoUrl,
                thumbnail: thumbnailMatch?.[1],
                title: title,
                author: author,
                quality: "Standard",
              },
            }
          } catch (urlError) {
            continue // Try next match
          }
        }
      }
    }

    throw new Error("No video URL found in Reel")
  } catch (error) {
    console.error("Instagram Reel extraction error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? `Failed to extract Reel: ${error.message}`
          : "Failed to extract Instagram Reel. The Reel might be private, deleted, or not accessible.",
    }
  }
}

// Enhanced function to extract Instagram carousel images with redirect handling
async function extractInstagramCarousel(url: string) {
  try {
    // Clean and normalize the URL
    const cleanUrl = url.replace(/\?.*$/, "").replace(/\/$/, "")

    // Ensure we have the full Instagram URL format
    if (!cleanUrl.includes("instagram.com/p/")) {
      throw new Error("Invalid Instagram post URL format")
    }

    console.log("Extracting carousel from:", cleanUrl)

    // Enhanced headers for better Instagram compatibility
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      DNT: "1",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Cache-Control": "max-age=0",
      Referer: "https://www.instagram.com/",
    }

    // First attempt with redirect following
    let response = await fetch(cleanUrl, {
      headers,
      redirect: "follow",
    })

    // Handle redirects manually if needed
    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get("location")
      if (location) {
        console.log("Following redirect to:", location)
        const redirectUrl = location.startsWith("http") ? location : `https://www.instagram.com${location}`
        response = await fetch(redirectUrl, {
          headers,
          redirect: "follow",
        })
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    console.log("HTML length:", html.length)

    // Extract title
    const titleMatch =
      html.match(/<meta property="og:title" content="([^"]+)"/) || html.match(/<title>([^<]+)<\/title>/)
    const title = titleMatch?.[1]?.replace(/"/g, "") || "Instagram Carousel"

    // Look for carousel images using multiple extraction methods
    const imageUrls: string[] = []

    // Method 1: Extract from Instagram's internal data structure (most reliable)
    const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});/)
    if (sharedDataMatch) {
      try {
        const sharedData = JSON.parse(sharedDataMatch[1])
        const entryData = sharedData?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media
        
        if (entryData?.edge_sidecar_to_children?.edges) {
          console.log("Found carousel data in shared data")
          entryData.edge_sidecar_to_children.edges.forEach((edge: any) => {
            const displayUrl = edge.node?.display_url
            if (displayUrl && !imageUrls.includes(displayUrl)) {
              imageUrls.push(displayUrl)
              console.log("Added image from shared data:", displayUrl)
            }
          })
        }
      } catch (e) {
        console.log("Failed to parse shared data:", e)
      }
    }

    // Method 2: Extract from additional Instagram data patterns
    const additionalPatterns = [
      /"carousel_media"\s*:\s*\[(.*?)\]/gs,
      /"edge_sidecar_to_children"\s*:\s*\{[^}]*"edges"\s*:\s*\[(.*?)\]/gs,
    ]

    for (const pattern of additionalPatterns) {
      const matches = html.matchAll(pattern)
      for (const match of matches) {
        const mediaData = match[1]
        const urlMatches = mediaData.matchAll(/"display_url"\s*:\s*"([^"]+)"/g)
        for (const urlMatch of urlMatches) {
          let imageUrl = urlMatch[1]
          imageUrl = imageUrl.replace(/\\u0026/g, "&").replace(/\\/g, "")
          if (imageUrl.includes("scontent") && !imageUrls.includes(imageUrl)) {
            imageUrls.push(imageUrl)
            console.log("Added image from pattern matching:", imageUrl)
          }
        }
      }
    }

    // Method 3: Extract display_url patterns from script content (enhanced)
    const displayUrlMatches = html.matchAll(/"display_url"\s*:\s*"([^"]+)"/g)
    for (const match of displayUrlMatches) {
      let imageUrl = match[1]
      // Clean up escaped characters
      imageUrl = imageUrl.replace(/\\u0026/g, "&").replace(/\\/g, "")

      // Validate it's a proper Instagram image URL
      if (imageUrl.includes("scontent") && imageUrl.includes("instagram") && !imageUrls.includes(imageUrl)) {
        imageUrls.push(imageUrl)
        console.log("Added image from display_url pattern:", imageUrl)
      }
    }

    // Method 4: Look for high-res image URLs in various patterns (enhanced)
    const imagePatterns = [
      /"src"\s*:\s*"([^"]*scontent[^"]*\.jpg[^"]*)"/g,
      /"url"\s*:\s*"([^"]*scontent[^"]*\.jpg[^"]*)"/g,
      /https:\/\/[^"'\s]*scontent[^"'\s]*\.jpg[^"'\s]*/g,
      /"image"\s*:\s*"([^"]*scontent[^"]*\.jpg[^"]*)"/g,
      /"thumbnail"\s*:\s*"([^"]*scontent[^"]*\.jpg[^"]*)"/g,
    ]

    for (const pattern of imagePatterns) {
      const matches = html.matchAll(pattern)
      for (const match of matches) {
        let imageUrl = match[1] || match[0]
        imageUrl = imageUrl.replace(/\\u0026/g, "&").replace(/\\/g, "")

        if (imageUrl.includes("scontent") && !imageUrls.includes(imageUrl)) {
          imageUrls.push(imageUrl)
          console.log("Added image from image pattern:", imageUrl)
        }
      }
    }

    // Method 5: Extract from JSON-LD structured data
    const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)
    for (const match of jsonLdMatches) {
      try {
        const jsonData = JSON.parse(match[1])
        if (jsonData.image && Array.isArray(jsonData.image)) {
          jsonData.image.forEach((img: string) => {
            if (img && !imageUrls.includes(img)) {
              imageUrls.push(img)
              console.log("Added image from JSON-LD:", img)
            }
          })
        } else if (jsonData.image && typeof jsonData.image === "string") {
          if (!imageUrls.includes(jsonData.image)) {
            imageUrls.push(jsonData.image)
            console.log("Added image from JSON-LD:", jsonData.image)
          }
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }

    // Method 6: Fallback to og:image and other meta tags
    if (imageUrls.length === 0) {
      const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
      if (ogImageMatch) {
        imageUrls.push(ogImageMatch[1])
        console.log("Added image from og:image:", ogImageMatch[1])
      }
      
      // Try additional meta tags
      const additionalMetaMatches = html.matchAll(/<meta[^>]*content="([^"]*scontent[^"]*\.jpg[^"]*)"/g)
      for (const match of additionalMetaMatches) {
        const imageUrl = match[1]
        if (imageUrl.includes("scontent") && !imageUrls.includes(imageUrl)) {
          imageUrls.push(imageUrl)
          console.log("Added image from meta tag:", imageUrl)
        }
      }
    }

    // Clean and validate URLs
    const validImages = imageUrls
      .map((url) => url.trim())
      .filter((url) => {
        try {
          new URL(url)
          return url.includes("scontent") || url.includes("instagram")
        } catch {
          return false
        }
      })
      // Remove duplicates
      .filter((url, index, arr) => arr.indexOf(url) === index)
      // Sort by URL to get consistent ordering
      .sort()

    console.log(`Found ${validImages.length} valid images in carousel`)

    if (validImages.length > 0) {
      return {
        success: true,
        data: {
          type: validImages.length > 1 ? "carousel" : "image",
          url: validImages[0], // First image as main URL
          thumbnail: validImages[0],
          title: title,
          quality: "High Resolution",
          images: validImages.length > 1 ? validImages : undefined, // Only set images array for carousels
        },
      }
    }

    throw new Error("No images found in the post")
  } catch (error) {
    console.error("Instagram carousel extraction error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? `Failed to extract carousel: ${error.message}`
          : "Failed to extract carousel images. The post might be private, deleted, or not accessible.",
    }
  }
}

// Enhanced function to extract Instagram carousel images with redirect handling (alternative method)
async function extractInstagramCarouselAlternative(url: string) {
  try {
    // Clean and normalize the URL
    const cleanUrl = url.replace(/\?.*$/, "").replace(/\/$/, "")

    // Ensure we have the full Instagram URL format
    if (!cleanUrl.includes("instagram.com/p/")) {
      throw new Error("Invalid Instagram post URL format")
    }

    console.log("Extracting carousel from:", cleanUrl)

    // Enhanced headers for better Instagram compatibility
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      DNT: "1",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Cache-Control": "max-age=0",
      Referer: "https://www.instagram.com/",
    }

    // First attempt with redirect following
    let response = await fetch(cleanUrl, {
      headers,
      redirect: "follow",
    })

    // Handle redirects manually if needed
    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get("location")
      if (location) {
        console.log("Following redirect to:", location)
        const redirectUrl = location.startsWith("http") ? location : `https://www.instagram.com${location}`
        response = await fetch(redirectUrl, {
          headers,
          redirect: "follow",
        })
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    console.log("HTML length:", html.length)

    // Extract title
    const titleMatch =
      html.match(/<meta property="og:title" content="([^"]+)"/) || html.match(/<title>([^<]+)<\/title>/)
    const title = titleMatch?.[1]?.replace(/"/g, "") || "Instagram Carousel"

    // Look for carousel images using multiple extraction methods
    const imageUrls: string[] = []

    // Method 1: Extract from Instagram's internal data structure (most reliable)
    const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});/)
    if (sharedDataMatch) {
      try {
        const sharedData = JSON.parse(sharedDataMatch[1])
        const entryData = sharedData?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media
        
        if (entryData?.edge_sidecar_to_children?.edges) {
          console.log("Found carousel data in shared data")
          entryData.edge_sidecar_to_children.edges.forEach((edge: any) => {
            const displayUrl = edge.node?.display_url
            if (displayUrl && !imageUrls.includes(displayUrl)) {
              imageUrls.push(displayUrl)
              console.log("Added image from shared data:", displayUrl)
            }
          })
        }
      } catch (e) {
        console.log("Failed to parse shared data:", e)
      }
    }

    // Method 2: Extract from additional Instagram data patterns
    const additionalPatterns = [
      /"carousel_media"\s*:\s*\[(.*?)\]/gs,
      /"edge_sidecar_to_children"\s*:\s*\{[^}]*"edges"\s*:\s*\[(.*?)\]/gs,
    ]

    for (const pattern of additionalPatterns) {
      const matches = html.matchAll(pattern)
      for (const match of matches) {
        const mediaData = match[1]
        const urlMatches = mediaData.matchAll(/"display_url"\s*:\s*"([^"]+)"/g)
        for (const urlMatch of urlMatches) {
          let imageUrl = urlMatch[1]
          imageUrl = imageUrl.replace(/\\u0026/g, "&").replace(/\\/g, "")
          if (imageUrl.includes("scontent") && !imageUrls.includes(imageUrl)) {
            imageUrls.push(imageUrl)
            console.log("Added image from pattern matching:", imageUrl)
          }
        }
      }
    }

    // Method 3: Extract display_url patterns from script content (enhanced)
    const displayUrlMatches = html.matchAll(/"display_url"\s*:\s*"([^"]+)"/g)
    for (const match of displayUrlMatches) {
      let imageUrl = match[1]
      // Clean up escaped characters
      imageUrl = imageUrl.replace(/\\u0026/g, "&").replace(/\\/g, "")

      // Validate it's a proper Instagram image URL
      if (imageUrl.includes("scontent") && imageUrl.includes("instagram") && !imageUrls.includes(imageUrl)) {
        imageUrls.push(imageUrl)
        console.log("Added image from display_url pattern:", imageUrl)
      }
    }

    // Method 4: Look for high-res image URLs in various patterns (enhanced)
    const imagePatterns = [
      /"src"\s*:\s*"([^"]*scontent[^"]*\.jpg[^"]*)"/g,
      /"url"\s*:\s*"([^"]*scontent[^"]*\.jpg[^"]*)"/g,
      /https:\/\/[^"'\s]*scontent[^"'\s]*\.jpg[^"'\s]*/g,
      /"image"\s*:\s*"([^"]*scontent[^"]*\.jpg[^"]*)"/g,
      /"thumbnail"\s*:\s*"([^"]*scontent[^"]*\.jpg[^"]*)"/g,
    ]

    for (const pattern of imagePatterns) {
      const matches = html.matchAll(pattern)
      for (const match of matches) {
        let imageUrl = match[1] || match[0]
        imageUrl = imageUrl.replace(/\\u0026/g, "&").replace(/\\/g, "")

        if (imageUrl.includes("scontent") && !imageUrls.includes(imageUrl)) {
          imageUrls.push(imageUrl)
          console.log("Added image from image pattern:", imageUrl)
        }
      }
    }

    // Method 5: Extract from JSON-LD structured data
    const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)
    for (const match of jsonLdMatches) {
      try {
        const jsonData = JSON.parse(match[1])
        if (jsonData.image && Array.isArray(jsonData.image)) {
          jsonData.image.forEach((img: string) => {
            if (img && !imageUrls.includes(img)) {
              imageUrls.push(img)
              console.log("Added image from JSON-LD:", img)
            }
          })
        } else if (jsonData.image && typeof jsonData.image === "string") {
          if (!imageUrls.includes(jsonData.image)) {
            imageUrls.push(jsonData.image)
            console.log("Added image from JSON-LD:", jsonData.image)
          }
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }

    // Method 6: Fallback to og:image and other meta tags
    if (imageUrls.length === 0) {
      const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
      if (ogImageMatch) {
        imageUrls.push(ogImageMatch[1])
        console.log("Added image from og:image:", ogImageMatch[1])
      }
      
      // Try additional meta tags
      const additionalMetaMatches = html.matchAll(/<meta[^>]*content="([^"]*scontent[^"]*\.jpg[^"]*)"/g)
      for (const match of additionalMetaMatches) {
        const imageUrl = match[1]
        if (imageUrl.includes("scontent") && !imageUrls.includes(imageUrl)) {
          imageUrls.push(imageUrl)
          console.log("Added image from meta tag:", imageUrl)
        }
      }
    }

    // Clean and validate URLs
    const validImages = imageUrls
      .map((url) => url.trim())
      .filter((url) => {
        try {
          new URL(url)
          return url.includes("scontent") || url.includes("instagram")
        } catch {
          return false
        }
      })
      // Remove duplicates
      .filter((url, index, arr) => arr.indexOf(url) === index)
      // Sort by URL to get consistent ordering
      .sort()

    console.log(`Found ${validImages.length} valid images in carousel`)

    if (validImages.length > 0) {
      return {
        success: true,
        data: {
          type: validImages.length > 1 ? "carousel" : "image",
          url: validImages[0], // First image as main URL
          thumbnail: validImages[0],
          title: title,
          quality: "High Resolution",
          images: validImages.length > 1 ? validImages : undefined, // Only set images array for carousels
        },
      }
    }

    throw new Error("No images found in the post")
  } catch (error) {
    console.error("Instagram carousel extraction error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? `Failed to extract carousel: ${error.message}`
          : "Failed to extract carousel images. The post might be private, deleted, or not accessible.",
    }
  }
}

// Simple HTML extraction for single media
async function extractFromHTML(url: string, platform: string, mediaType = "video") {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // Look for video in meta tags
    const videoMatch =
      html.match(/<meta property="og:video:secure_url" content="([^"]+)"/) ||
      html.match(/<meta property="og:video" content="([^"]+)"/)

    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/)

    if (videoMatch && (mediaType === "video" || mediaType === "stories" || mediaType === "reels")) {
      return {
        success: true,
        data: {
          type: mediaType === "reels" ? "reel" : "video",
          url: videoMatch[1],
          thumbnail: imageMatch?.[1],
          title: titleMatch?.[1] || `${platform} ${mediaType === "reels" ? "Reel" : "Video"}`,
          quality: "Standard",
        },
      }
    } else if (imageMatch && (mediaType === "images" || platform === "instagram")) {
      return {
        success: true,
        data: {
          type: "image",
          url: imageMatch[1],
          thumbnail: imageMatch[1],
          title: titleMatch?.[1] || `Instagram Image`,
          quality: "High Resolution",
        },
      }
    }

    throw new Error(`No ${mediaType} found`)
  } catch (error) {
    return {
      success: false,
      error: `Failed to extract ${mediaType} from ${platform}`,
    }
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
