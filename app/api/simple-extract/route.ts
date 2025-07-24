import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ 
        success: false, 
        error: "URL is required" 
      }, { status: 400 })
    }

    console.log("Processing URL:", url)

    // Determine platform
    const isTikTok = url.includes("tiktok.com") || url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com")
    const isInstagram = url.includes("instagram.com")

    if (!isTikTok && !isInstagram) {
      return NextResponse.json({
        success: false,
        error: "Only TikTok and Instagram URLs are supported"
      }, { status: 400 })
    }

    let result
    if (isTikTok) {
      result = await extractTikTok(url)
    } else {
      result = await extractInstagram(url)
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }

  } catch (error) {
    console.error("Extraction error:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
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
              quality: videoData.hdplay ? "HD" : "Standard"
            }
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
      error: "Failed to extract TikTok video"
    }
  }
}

// Simple Instagram extraction
async function extractInstagram(url: string) {
  try {
    const cleanUrl = url.replace(/\?.*$/, "").replace(/\/$/, "")
    return await extractFromHTML(cleanUrl, "instagram")
  } catch (error) {
    console.error("Instagram extraction error:", error)
    return {
      success: false,
      error: "Failed to extract Instagram media"
    }
  }
}

// Simple HTML extraction
async function extractFromHTML(url: string, platform: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // Look for video in meta tags
    const videoMatch = html.match(/<meta property="og:video:secure_url" content="([^"]+)"/) ||
                      html.match(/<meta property="og:video" content="([^"]+)"/)
    
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/)

    if (videoMatch) {
      return {
        success: true,
        data: {
          type: "video",
          url: videoMatch[1],
          thumbnail: imageMatch?.[1],
          title: titleMatch?.[1] || `${platform} Video`,
          quality: "Standard"
        }
      }
    } else if (imageMatch && platform === "instagram") {
      return {
        success: true,
        data: {
          type: "image",
          url: imageMatch[1],
          thumbnail: imageMatch[1],
          title: titleMatch?.[1] || "Instagram Image",
          quality: "High Resolution"
        }
      }
    }

    throw new Error("No media found")
    
  } catch (error) {
    return {
      success: false,
      error: `Failed to extract from ${platform}`
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
