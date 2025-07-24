"use server"

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

interface DownloadParams {
  url: string
  mediaType: string
}

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

// Simple Instagram scraper using meta tags
export async function downloadInstagramMedia(params: DownloadParams) {
  try {
    const { url, mediaType } = params

    const cleanUrl = url.replace(/\?.*$/, "").replace(/\/$/, "")

    const response = await fetch(cleanUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    })

    const html = await response.text()

    // Extract from meta tags
    const videoUrlMatch =
      html.match(/<meta property="og:video:secure_url" content="([^"]+)"/) ||
      html.match(/<meta property="og:video" content="([^"]+)"/)
    const imageUrlMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/)

    const videoUrl = videoUrlMatch?.[1]
    const imageUrl = imageUrlMatch?.[1]
    const title = titleMatch?.[1] || "Instagram Media"

    if (videoUrl) {
      const result: MediaResult = {
        type: "video",
        url: videoUrl,
        thumbnail: imageUrl,
        title: title,
        author: "Unknown",
        quality: "Standard",
      }

      await logDownload("instagram", url, mediaType, result)
      return { success: true, data: result }
    } else if (imageUrl) {
      const result: MediaResult = {
        type: "image",
        url: imageUrl,
        thumbnail: imageUrl,
        title: title,
        author: "Unknown",
        quality: "High Resolution",
      }

      await logDownload("instagram", url, mediaType, result)
      return { success: true, data: result }
    }

    return {
      success: false,
      error: "Could not extract media from Instagram. The post might be private or deleted.",
    }
  } catch (error) {
    console.error("Instagram scraping error:", error)
    return {
      success: false,
      error: "Failed to extract media from Instagram. Please check the URL and try again.",
    }
  }
}

// New TikTok scraper using a different approach
export async function downloadTikTokMedia(params: DownloadParams) {
  try {
    const { url, mediaType } = params

    // Clean the URL
    const cleanUrl = resolveTikTokUrl(url)

    // Method 1: Try TikTok downloader service (using a public API)
    const downloadResult = await useTikTokDownloaderService(cleanUrl, mediaType)
    if (downloadResult.success) {
      return downloadResult
    }
    console.log("TikTok downloader service failed:", downloadResult.error)

    // Method 2: Try meta tag extraction
    const metaResult = await extractTikTokFromMeta(cleanUrl, mediaType)
    if (metaResult.success) {
      return metaResult
    }
    console.log("Meta tag extraction failed:", metaResult.error)

    // Method 3: Try regex extraction from HTML
    const regexResult = await extractTikTokWithRegex(cleanUrl, mediaType)
    if (regexResult.success) {
      return regexResult
    }
    console.log("Regex extraction failed:", regexResult.error)

    return {
      success: false,
      error: "Could not extract video from TikTok. The video might be private, deleted, or region-restricted.",
    }
  } catch (error) {
    console.error("TikTok scraping error:", error)
    return {
      success: false,
      error: "Failed to extract video from TikTok. Please check the URL and try again.",
    }
  }
}

// Use a TikTok downloader service
async function useTikTokDownloaderService(url: string, mediaType: string) {
  try {
    // Using SnapTik-like approach (free service)
    const apiUrl = "https://www.tikwm.com/api/"

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: `url=${encodeURIComponent(url)}&hd=1`,
    })

    if (response.ok) {
      const data = await response.json()

      if (data.code === 0 && data.data) {
        const videoData = data.data

        // Get the best quality video URL
        const videoUrl = videoData.hdplay || videoData.play || videoData.wmplay
        const quality = videoData.hdplay ? "HD" : "Standard"

        if (videoUrl) {
          const result: MediaResult = {
            type: "video",
            url: videoUrl,
            thumbnail: videoData.cover,
            title: videoData.title || "TikTok Video",
            author: videoData.author?.unique_id || "Unknown",
            duration: videoData.duration ? `${videoData.duration}s` : undefined,
            quality: quality,
          }

          await logDownload("tiktok", url, mediaType, result)
          return { success: true, data: result }
        }
      }
    }

    return { success: false, error: "Downloader service failed" }
  } catch (error) {
    return { success: false, error: "Downloader service failed" }
  }
}

// Extract TikTok video from meta tags
async function extractTikTokFromMeta(url: string, mediaType: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.tiktok.com/",
      },
    })

    const html = await response.text()

    // Extract from meta tags
    const videoUrlMatch = html.match(/<meta property="og:video" content="([^"]+)"/)
    const imageUrlMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/)

    const videoUrl = videoUrlMatch?.[1]
    const imageUrl = imageUrlMatch?.[1]
    const title = titleMatch?.[1] || "TikTok Video"

    if (videoUrl) {
      const result: MediaResult = {
        type: "video",
        url: videoUrl,
        thumbnail: imageUrl,
        title: title,
        author: "Unknown",
        quality: "Standard",
      }

      await logDownload("tiktok", url, mediaType, result)
      return { success: true, data: result }
    }

    return { success: false, error: "No video found in meta tags" }
  } catch (error) {
    return { success: false, error: "Meta extraction failed" }
  }
}

// Extract TikTok video using regex patterns
async function extractTikTokWithRegex(url: string, mediaType: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        Referer: "https://www.tiktok.com/",
      },
    })

    const html = await response.text()

    // Look for video URLs in the HTML using various patterns
    const patterns = [
      /"playAddr":"([^"]*\.mp4[^"]*)"/g,
      /"downloadAddr":"([^"]*\.mp4[^"]*)"/g,
      /https:\/\/[^"'\s]*\.mp4[^"'\s]*/g,
      /"video_url":"([^"]+)"/g,
    ]

    for (const pattern of patterns) {
      const matches = Array.from(html.matchAll(pattern))

      if (matches.length > 0) {
        for (const match of matches) {
          let videoUrl = match[1] || match[0]

          // Clean the URL
          if (videoUrl.includes("\\u002F")) {
            videoUrl = videoUrl.replace(/\\u002F/g, "/").replace(/\\/g, "")
          }

          // Skip thumbnail and cover URLs
          if (
            videoUrl.includes("video") &&
            !videoUrl.includes("thumbnail") &&
            !videoUrl.includes("cover") &&
            !videoUrl.includes("preview")
          ) {
            try {
              // Validate the URL
              new URL(videoUrl)

              const result: MediaResult = {
                type: "video",
                url: videoUrl,
                thumbnail: extractThumbnailFromHtml(html),
                title: "TikTok Video",
                author: "Unknown",
                quality: "Standard",
              }

              await logDownload("tiktok", url, mediaType, result)
              return { success: true, data: result }
            } catch (urlError) {
              continue // Try next match
            }
          }
        }
      }
    }

    return { success: false, error: "No valid video URLs found" }
  } catch (error) {
    return { success: false, error: "Regex extraction failed" }
  }
}

// Resolve TikTok short URLs
function resolveTikTokUrl(url: string): string {
  try {
    const cleanUrl = url.replace(/\?.*$/, "")

    if (cleanUrl.includes("vm.tiktok.com") || cleanUrl.includes("vt.tiktok.com")) {
      throw new Error("Redirect needed")
    }

    return cleanUrl
  } catch (error) {
    return url
  }
}

// Helper functions
function extractThumbnailFromHtml(html: string): string | undefined {
  const match = html.match(/https:\/\/[^"]*\.(jpg|jpeg|png|webp)[^"]*/i)
  return match ? match[0] : undefined
}

// Logging function
async function logDownload(platform: string, url: string, mediaType: string, result: MediaResult) {
  try {
    await sql`
      INSERT INTO generations (
        input_type, input_content, tone, 
        generated_title, generated_description
      ) VALUES (
        ${platform}, ${url.substring(0, 500)}, ${mediaType}, 
        ${(result.title || `${platform} Media`).substring(0, 255)}, 
        ${(result.author || "Unknown").substring(0, 255)}
      )
    `
  } catch (dbError) {
    console.error("Database logging error:", dbError)
    // Don't fail the main operation
  }
}
