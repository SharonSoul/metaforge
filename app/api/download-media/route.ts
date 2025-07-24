import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url, filename, platform } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log("Processing media download for URL:", url)

    // Enhanced headers for better media access
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "identity",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Connection": "keep-alive",
      "Sec-Fetch-Dest": "video",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site",
    }

    // Add platform-specific headers
    if (platform === "tiktok" || url.includes("tiktok")) {
      headers["Referer"] = "https://www.tiktok.com/"
      headers["Origin"] = "https://www.tiktok.com"
    } else if (platform === "instagram" || url.includes("instagram")) {
      headers["Referer"] = "https://www.instagram.com/"
      headers["Origin"] = "https://www.instagram.com"
    }

    // First check if the URL is accessible with HEAD request (no timeout)
    let headResponse
    try {
      headResponse = await fetch(url, {
        method: "HEAD",
        headers,
      })

      console.log("HEAD response status:", headResponse.status)
      console.log("Content-Type:", headResponse.headers.get("content-type"))
      console.log("Content-Length:", headResponse.headers.get("content-length"))

      if (!headResponse.ok) {
        return NextResponse.json(
          { error: `Media not accessible: ${headResponse.status}` },
          { status: headResponse.status },
        )
      }
    } catch (headError) {
      console.log("HEAD request failed, proceeding with GET:", headError)
    }

    // Fetch the media content (no timeout - let it run)
    const response = await fetch(url, {
      headers,
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to download: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    const contentType = response.headers.get("content-type") || "video/mp4"
    const contentLength = response.headers.get("content-length")

    console.log("Download response - Content-Type:", contentType, "Content-Length:", contentLength)

    // Read the response as array buffer
    const arrayBuffer = await response.arrayBuffer()
    const fileSize = arrayBuffer.byteLength

    console.log("Downloaded file size:", fileSize, "bytes")

    // Check if we got a reasonable file size
    if (fileSize < 1024 * 50) {
      // Less than 50KB is suspicious
      return NextResponse.json(
        {
          error: "Downloaded file is too small",
          details: `File size: ${fileSize} bytes. This might be an error page or placeholder.`,
        },
        { status: 400 },
      )
    }

    // Determine file extension based on content type
    let fileExtension = "mp4"
    if (contentType.includes("webm")) {
      fileExtension = "webm"
    } else if (contentType.includes("image")) {
      fileExtension = contentType.includes("jpeg") ? "jpg" : contentType.includes("png") ? "png" : "jpg"
    } else if (contentType.includes("audio")) {
      fileExtension = "mp3"
    }

    const finalFilename = filename || `media_${Date.now()}.${fileExtension}`

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${finalFilename}"`,
        "Content-Length": fileSize.toString(),
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error) {
    console.error("Media download error:", error)

    if (error instanceof Error) {
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
