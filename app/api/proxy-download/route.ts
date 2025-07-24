import { type NextRequest, NextResponse } from "next/server"
import { AbortSignal } from "abort-controller"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log("Proxying download for URL:", url)

    // Enhanced headers for better compatibility
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "identity", // Prevent compression issues
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Connection: "keep-alive",
    }

    // Add platform-specific headers
    if (url.includes("tiktok")) {
      headers["Referer"] = "https://www.tiktok.com/"
      headers["Origin"] = "https://www.tiktok.com"
      headers["Sec-Fetch-Dest"] = "video"
      headers["Sec-Fetch-Mode"] = "cors"
      headers["Sec-Fetch-Site"] = "cross-site"
    } else if (url.includes("instagram")) {
      headers["Referer"] = "https://www.instagram.com/"
      headers["Origin"] = "https://www.instagram.com"
      headers["X-Instagram-AJAX"] = "1"
    }

    // First, try a HEAD request to check if the URL is accessible and get content info
    try {
      const headResponse = await fetch(url, {
        method: "HEAD",
        headers,
      })

      console.log("HEAD response status:", headResponse.status)
      console.log("HEAD response headers:", Object.fromEntries(headResponse.headers.entries()))

      if (!headResponse.ok) {
        return NextResponse.json(
          { error: `Media not accessible: ${headResponse.status} ${headResponse.statusText}` },
          { status: headResponse.status },
        )
      }

      const contentLength = headResponse.headers.get("content-length")
      const contentType = headResponse.headers.get("content-type")

      console.log("Content-Length:", contentLength, "Content-Type:", contentType)

      // Check if it's actually a video/image file
      if (contentType && !contentType.includes("video") && !contentType.includes("image")) {
        return NextResponse.json({ error: "URL does not point to a media file" }, { status: 400 })
      }

      // Check file size (warn if too small - likely not the actual video)
      if (contentLength) {
        const sizeInMB = Number.parseInt(contentLength) / (1024 * 1024)
        console.log("File size:", sizeInMB, "MB")

        if (sizeInMB < 0.5) {
          console.warn("File size is very small, might be a placeholder")
        }
      }
    } catch (headError) {
      console.log("HEAD request failed:", headError)
      // Continue with GET request anyway
    }

    // Now fetch the actual content
    const response = await fetch(url, {
      headers,
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    console.log("GET response status:", response.status)
    console.log("GET response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch media: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    // Get the content type and size
    const contentType = response.headers.get("content-type") || "application/octet-stream"
    const contentLength = response.headers.get("content-length")

    console.log("Final Content-Type:", contentType, "Content-Length:", contentLength)

    // Stream the response
    const arrayBuffer = await response.arrayBuffer()

    console.log("Downloaded", arrayBuffer.byteLength, "bytes")

    // Check if we got a reasonable file size
    if (arrayBuffer.byteLength < 1024 * 100) {
      // Less than 100KB is suspicious for a video
      console.warn("Downloaded file is very small:", arrayBuffer.byteLength, "bytes")
    }

    // Determine file extension based on content type
    let fileExtension = "mp4"
    if (contentType.includes("image")) {
      fileExtension = contentType.includes("jpeg") ? "jpg" : contentType.includes("png") ? "png" : "jpg"
    } else if (contentType.includes("video")) {
      fileExtension = contentType.includes("webm") ? "webm" : "mp4"
    }

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="media.${fileExtension}"`,
        "Content-Length": arrayBuffer.byteLength.toString(),
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error) {
    console.error("Proxy download error:", error)

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return NextResponse.json({ error: "Download timeout - file too large or server too slow" }, { status: 408 })
      }
      return NextResponse.json({ error: `Download failed: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
