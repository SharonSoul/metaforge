import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { images, title } = await request.json()

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 })
    }

    console.log(`Creating zip with ${images.length} images`)

    // For now, we'll create a simple response that the frontend can handle
    // In a production environment, you'd want to use a proper zip library
    // like 'archiver' or 'jszip' on the server side

    // Since we're in a simple environment, let's return the image URLs
    // and let the frontend handle the zip creation using JSZip
    return NextResponse.json({
      success: true,
      images: images,
      title: title || "Instagram Carousel",
      message: "Use frontend zip creation",
    })
  } catch (error) {
    console.error("Zip creation error:", error)
    return NextResponse.json({ error: "Failed to create zip file" }, { status: 500 })
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
