"use server"

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

interface ExtractParams {
  platform: "instagram" | "tiktok"
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

export async function extractMedia(params: ExtractParams) {
  try {
    const { platform, url, mediaType } = params

    if (platform === "tiktok") {
      return await extractTikTokMedia(url, mediaType)
    } else {
      return await extractInstagramMedia(url, mediaType)
    }
  } catch (error) {
    console.error("Media extraction error:", error)
    return {
      success: false,
      error: "Failed to extract media. Please check the URL and try again.",
    }
  }
}

async function extractTikTokMedia(url: string, mediaType: string) {
  try {
    // Clean the URL
    const cleanUrl = url.replace(/\?.*$/, "").replace(/\/$/, "")

    // Method 1: TikWM API Service (Primary)
    console.log("Trying TikWM API service...")
    const tikwmResult = await useTikWMService(cleanUrl, mediaType)
    if (tikwmResult.success) {
      console.log("TikWM API successful")
      return tikwmResult
    }
    console.log("TikWM API failed:", tikwmResult.error)

    // Method 2: Meta Tag Extraction (Fallback)
    console.log("Trying meta tag extraction...")
    const metaResult = await extractFromMetaTags(cleanUrl, mediaType, "tiktok")
    if (metaResult.success) {
      console.log("Meta tag extraction successful")
      return metaResult
    }
    console.log("Meta tag extraction failed:", metaResult.error)

    // Method 3: HTML Pattern Matching (Last Resort)
    console.log("Trying HTML pattern matching...")
    const patternResult = await extractFromHTMLPatterns(cleanUrl, mediaType, "tiktok")
    if (patternResult.success) {
      console.log("HTML pattern matching successful")
      return patternResult
    }
    console.log("HTML pattern matching failed:", patternResult.error)

    return {
      success: false,
      error: "Could not extract video from TikTok. The video might be private, deleted, or region-restricted.",
    }
  } catch (error) {
    console.error("TikTok extraction error:", error)
    return {
      success: false,
      error: "Failed to extract TikTok video. Please check the URL and try again.",
    }
  }
}

async function extractInstagramMedia(url: string, mediaType: string) {
  try {
    const cleanUrl = url.replace(/\?.*$/, "").replace(/\/$/, "")

    // For Instagram videos/reels, try BitLoader API first
    if (mediaType === "video") {
      console.log("Trying BitLoader API for Instagram video...")
      const bitloaderResult = await useBitLoaderService(cleanUrl)
      if (bitloaderResult.success) {
        console.log("BitLoader API successful")
        return bitloaderResult
      }
      console.log("BitLoader API failed:", bitloaderResult.error)

      // Try SaveFrom.net API as fallback
      console.log("Trying SaveFrom.net API for Instagram video...")
      const savefromResult = await useSaveFromService(cleanUrl)
      if (savefromResult.success) {
        console.log("SaveFrom.net API successful")
        return savefromResult
      }
      console.log("SaveFrom.net API failed:", savefromResult.error)

      // Try RapidAPI Instagram Downloader as another fallback
      console.log("Trying RapidAPI Instagram Downloader...")
      const rapidapiResult = await useRapidAPIService(cleanUrl)
      if (rapidapiResult.success) {
        console.log("RapidAPI Instagram Downloader successful")
        return rapidapiResult
      }
      console.log("RapidAPI Instagram Downloader failed:", rapidapiResult.error)

      // Try SnapTik API as another fallback
      console.log("Trying SnapTik API for Instagram video...")
      const snaptikResult = await useSnapTikService(cleanUrl)
      if (snaptikResult.success) {
        console.log("SnapTik API successful")
        return snaptikResult
      }
      console.log("SnapTik API failed:", snaptikResult.error)

      // Try SSSTikTok API as another fallback (works for Instagram too)
      console.log("Trying SSSTikTok API for Instagram video...")
      const ssstiktokResult = await useSSSTikTokService(cleanUrl)
      if (ssstiktokResult.success) {
        console.log("SSSTikTok API successful")
        return ssstiktokResult
      }
      console.log("SSSTikTok API failed:", ssstiktokResult.error)
    }

    // Method 1: Meta Tag Extraction (Primary for Instagram)
    console.log("Trying Instagram meta tag extraction...")
    const metaResult = await extractFromMetaTags(cleanUrl, mediaType, "instagram")
    if (metaResult.success) {
      console.log("Instagram meta tag extraction successful")
      return metaResult
    }
    console.log("Instagram meta tag extraction failed:", metaResult.error)

    // Method 2: HTML Pattern Matching (Fallback)
    console.log("Trying Instagram HTML pattern matching...")
    const patternResult = await extractFromHTMLPatterns(cleanUrl, mediaType, "instagram")
    if (patternResult.success) {
      console.log("Instagram HTML pattern matching successful")
      return patternResult
    }
    console.log("Instagram HTML pattern matching failed:", patternResult.error)

    return {
      success: false,
      error: "Could not extract media from Instagram. The post might be private or deleted.",
    }
  } catch (error) {
    console.error("Instagram extraction error:", error)
    return {
      success: false,
      error: "Failed to extract Instagram media. Please check the URL and try again.",
    }
  }
}

// TikWM API Service - Professional TikTok Downloader (NO TIMEOUT)
async function useTikWMService(url: string, mediaType: string) {
  try {
    const apiUrl = "https://www.tikwm.com/api/"
    
    // Simple fetch without any timeout or AbortController
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://www.tikwm.com",
        "Referer": "https://www.tikwm.com/",
      },
      body: `url=${encodeURIComponent(url)}&hd=1`,
    })

    if (!response.ok) {
      throw new Error(`TikWM API returned ${response.status}`)
    }

    const data = await response.json()
    console.log("TikWM API response:", data)

    if (data.code === 0 && data.data) {
      const videoData = data.data

      // Get the best quality video URL
      const videoUrl = videoData.hdplay || videoData.play || videoData.wmplay
      const quality = videoData.hdplay ? "HD (1080p)" : videoData.play ? "Standard (720p)" : "Watermarked"

      if (videoUrl) {
        const result: MediaResult = {
          type: mediaType === "audio" ? "audio" : "video",
          url: videoUrl,
          thumbnail: videoData.cover,
          title: videoData.title || "TikTok Video",
          author: videoData.author?.unique_id || "Unknown",
          duration: videoData.duration ? `${videoData.duration}s` : undefined,
          quality: mediaType === "audio" ? "Audio Only" : quality,
          fileSize: videoData.size ? `${Math.round(videoData.size / 1024 / 1024)}MB` : undefined,
        }

        await logDownload("tiktok", url, mediaType, result)
        return { success: true, data: result }
      }
    }

    throw new Error("No video data found in TikWM response")
  } catch (error) {
    console.error("TikWM API error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "TikWM service failed" 
    }
  }
}

// BitLoader API Service - Reliable Instagram Video Downloader (NO TIMEOUT)
async function useBitLoaderService(url: string) {
  try {
    const apiUrl = "https://www.bitloader.app/api/v1/download"
    
    // Simple fetch without any timeout or AbortController
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://www.bitloader.app",
        "Referer": "https://www.bitloader.app/",
      },
      body: `url=${encodeURIComponent(url)}`,
    })

    if (!response.ok) {
      throw new Error(`BitLoader API returned ${response.status}`)
    }

    const data = await response.json()
    console.log("BitLoader API response:", data)

    if (data.code === 0 && data.data) {
      const videoData = data.data

      // Get the best quality video URL
      const videoUrl = videoData.url
      const quality = "High Quality"

      if (videoUrl) {
        const result: MediaResult = {
          type: "video",
          url: videoUrl,
          thumbnail: videoData.thumbnail,
          title: videoData.title || "Instagram Video",
          author: videoData.author || "Unknown",
          duration: videoData.duration ? `${videoData.duration}s` : undefined,
          quality: quality,
          fileSize: videoData.size ? `${Math.round(videoData.size / 1024 / 1024)}MB` : undefined,
        }

        await logDownload("instagram", url, "video", result)
        return { success: true, data: result }
      }
    }

    throw new Error("No video data found in BitLoader response")
  } catch (error) {
    console.error("BitLoader API error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "BitLoader service failed" 
    }
  }
}

// SaveFrom.net API Service - Alternative Instagram Video Downloader
async function useSaveFromService(url: string) {
  try {
    const apiUrl = "https://savefrom.net/api/convert"
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://savefrom.net",
        "Referer": "https://savefrom.net/",
      },
      body: `url=${encodeURIComponent(url)}`,
    })

    if (!response.ok) {
      throw new Error(`SaveFrom API returned ${response.status}`)
    }

    const data = await response.json()
    console.log("SaveFrom API response:", data)

    if (data.url && data.url.length > 0) {
      const videoUrl = data.url[0].url
      const quality = "High Quality"

      if (videoUrl) {
        const result: MediaResult = {
          type: "video",
          url: videoUrl,
          thumbnail: data.thumb,
          title: data.meta?.title || "Instagram Video",
          author: data.meta?.author || "Unknown",
          quality: quality,
        }

        await logDownload("instagram", url, "video", result)
        return { success: true, data: result }
      }
    }

    throw new Error("No video data found in SaveFrom response")
  } catch (error) {
    console.error("SaveFrom API error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "SaveFrom service failed" 
    }
  }
}

// RapidAPI Instagram Downloader Service
async function useRapidAPIService(url: string) {
  try {
    // Check if API key is configured
    const apiKey = process.env.RAPIDAPI_KEY
    if (!apiKey) {
      throw new Error("RapidAPI key not configured")
    }

    const apiUrl = "https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/index"
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "instagram-downloader-download-instagram-videos-stories.p.rapidapi.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    })

    if (!response.ok) {
      throw new Error(`RapidAPI returned ${response.status}`)
    }

    const data = await response.json()
    console.log("RapidAPI response:", data)

    if (data.url) {
      const result: MediaResult = {
        type: "video",
        url: data.url,
        thumbnail: data.thumbnail,
        title: data.title || "Instagram Video",
        author: data.author || "Unknown",
        quality: "High Quality",
      }

      await logDownload("instagram", url, "video", result)
      return { success: true, data: result }
    }

    throw new Error("No video data found in RapidAPI response")
  } catch (error) {
    console.error("RapidAPI error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "RapidAPI service failed" 
    }
  }
}

// SnapTik API Service - Reliable Instagram Video Downloader (NO TIMEOUT)
async function useSnapTikService(url: string) {
  try {
    const apiUrl = "https://snaptik.app/v2/download"
    
    // Simple fetch without any timeout or AbortController
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://snaptik.app",
        "Referer": "https://snaptik.app/",
      },
      body: `url=${encodeURIComponent(url)}`,
    })

    if (!response.ok) {
      throw new Error(`SnapTik API returned ${response.status}`)
    }

    const data = await response.json()
    console.log("SnapTik API response:", data)

    if (data.code === 0 && data.data) {
      const videoData = data.data

      // Get the best quality video URL
      const videoUrl = videoData.hdplay || videoData.play || videoData.wmplay
      const quality = videoData.hdplay ? "HD (1080p)" : videoData.play ? "Standard (720p)" : "Watermarked"

      if (videoUrl) {
        const result: MediaResult = {
          type: "video",
          url: videoUrl,
          thumbnail: videoData.cover,
          title: videoData.title || "Instagram Video",
          author: videoData.author?.unique_id || "Unknown",
          duration: videoData.duration ? `${videoData.duration}s` : undefined,
          quality: quality,
          fileSize: videoData.size ? `${Math.round(videoData.size / 1024 / 1024)}MB` : undefined,
        }

        await logDownload("instagram", url, "video", result)
        return { success: true, data: result }
      }
    }

    throw new Error("No video data found in SnapTik response")
  } catch (error) {
    console.error("SnapTik API error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "SnapTik service failed" 
    }
  }
}

// SSSTikTok API Service - Reliable TikTok Downloader (NO TIMEOUT)
async function useSSSTikTokService(url: string) {
  try {
    const apiUrl = "https://ssstik.io/download"
    
    // Simple fetch without any timeout or AbortController
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://ssstik.io",
        "Referer": "https://ssstik.io/",
      },
      body: `url=${encodeURIComponent(url)}`,
    })

    if (!response.ok) {
      throw new Error(`SSSTikTok API returned ${response.status}`)
    }

    const data = await response.json()
    console.log("SSSTikTok API response:", data)

    if (data.code === 0 && data.data) {
      const videoData = data.data

      // Get the best quality video URL
      const videoUrl = videoData.hdplay || videoData.play || videoData.wmplay
      const quality = videoData.hdplay ? "HD (1080p)" : videoData.play ? "Standard (720p)" : "Watermarked"

      if (videoUrl) {
        const result: MediaResult = {
          type: "video",
          url: videoUrl,
          thumbnail: videoData.cover,
          title: videoData.title || "Instagram Video",
          author: videoData.author?.unique_id || "Unknown",
          duration: videoData.duration ? `${videoData.duration}s` : undefined,
          quality: quality,
          fileSize: videoData.size ? `${Math.round(videoData.size / 1024 / 1024)}MB` : undefined,
        }

        await logDownload("instagram", url, "video", result)
        return { success: true, data: result }
      }
    }

    throw new Error("No video data found in SSSTikTok response")
  } catch (error) {
    console.error("SSSTikTok API error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "SSSTikTok service failed" 
    }
  }
}

// Meta Tag Extraction - Works for both platforms (NO TIMEOUT)
async function extractFromMetaTags(url: string, mediaType: string, platform: string) {
  try {
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
    }

    if (platform === "tiktok") {
      headers["Referer"] = "https://www.tiktok.com/"
    } else {
      headers["Referer"] = "https://www.instagram.com/"
    }

    // Simple fetch without timeout
    const response = await fetch(url, { headers })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // Extract meta tags
    const videoUrlMatch = 
      html.match(/<meta property="og:video:secure_url" content="([^"]+)"/) ||
      html.match(/<meta property="og:video" content="([^"]+)"/)
    const imageUrlMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/)
    const descriptionMatch = html.match(/<meta property="og:description" content="([^"]+)"/)

    const videoUrl = videoUrlMatch?.[1]
    const imageUrl = imageUrlMatch?.[1]
    const title = titleMatch?.[1] || `${platform} Media`
    const description = descriptionMatch?.[1]

    if (videoUrl) {
      const result: MediaResult = {
        type: mediaType === "audio" ? "audio" : "video",
        url: videoUrl,
        thumbnail: imageUrl,
        title: title,
        author: extractAuthorFromDescription(description) || "Unknown",
        quality: mediaType === "audio" ? "Audio Only" : "Standard",
      }

      await logDownload(platform, url, mediaType, result)
      return { success: true, data: result }
    } else if (imageUrl && platform === "instagram") {
      const result: MediaResult = {
        type: "image",
        url: imageUrl,
        thumbnail: imageUrl,
        title: title,
        author: extractAuthorFromDescription(description) || "Unknown",
        quality: "High Resolution",
      }

      await logDownload(platform, url, mediaType, result)
      return { success: true, data: result }
    }

    throw new Error("No media found in meta tags")
  } catch (error) {
    console.error("Meta tag extraction error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Meta tag extraction failed" 
    }
  }
}

// HTML Pattern Matching - Advanced regex patterns (NO TIMEOUT)
async function extractFromHTMLPatterns(url: string, mediaType: string, platform: string) {
  try {
    const headers: Record<string, string> = {
      "User-Agent": platform === "tiktok" 
        ? "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
        : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    }

    if (platform === "tiktok") {
      headers["Referer"] = "https://www.tiktok.com/"
    } else {
      headers["Referer"] = "https://www.instagram.com/"
    }

    // Simple fetch without timeout
    const response = await fetch(url, { headers })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // Platform-specific patterns
    let patterns: RegExp[] = []
    
    if (platform === "tiktok") {
      patterns = [
        /"playAddr":"([^"]*\.mp4[^"]*)"/g,
        /"downloadAddr":"([^"]*\.mp4[^"]*)"/g,
        /https:\/\/[^"'\s]*\.mp4[^"'\s]*/g,
        /"video_url":"([^"]+)"/g,
        /"play_url":"([^"]+)"/g,
      ]
    } else {
      patterns = [
        /"video_url":"([^"]+)"/g,
        /https:\/\/[^"'\s]*\.mp4[^"'\s]*/g,
        /"src":"([^"]*\.mp4[^"]*)"/g,
      ]
    }

    for (const pattern of patterns) {
      const matches = Array.from(html.matchAll(pattern))

      if (matches.length > 0) {
        for (const match of matches) {
          let mediaUrl = match[1] || match[0]

          // Clean the URL
          if (mediaUrl.includes("\\u002F")) {
            mediaUrl = mediaUrl.replace(/\\u002F/g, "/").replace(/\\/g, "")
          }

          // Skip unwanted URLs
          if (
            mediaUrl.includes("video") &&
            !mediaUrl.includes("thumbnail") &&
            !mediaUrl.includes("cover") &&
            !mediaUrl.includes("preview") &&
            !mediaUrl.includes("avatar")
          ) {
            try {
              // Validate the URL
              new URL(mediaUrl)

              const result: MediaResult = {
                type: mediaType === "audio" ? "audio" : "video",
                url: mediaUrl,
                thumbnail: extractThumbnailFromHtml(html),
                title: `${platform} ${mediaType === "audio" ? "Audio" : "Video"}`,
                author: "Unknown",
                quality: mediaType === "audio" ? "Audio Only" : "Standard",
              }

              await logDownload(platform, url, mediaType, result)
              return { success: true, data: result }
            } catch (urlError) {
              continue // Try next match
            }
          }
        }
      }
    }

    throw new Error("No valid media URLs found in HTML")
  } catch (error) {
    console.error("HTML pattern matching error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "HTML pattern matching failed" 
    }
  }
}

// Helper functions
function extractAuthorFromDescription(description?: string): string | undefined {
  if (!description) return undefined
  
  const match = description.match(/@([a-zA-Z0-9_.]+)/)
  return match ? match[1] : undefined
}

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
