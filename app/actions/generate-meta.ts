"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { neon } from "@neondatabase/serverless"

// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required")
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

const sql = neon(process.env.DATABASE_URL)

interface GenerateMetaParams {
  inputType: "url" | "manual"
  content: string
  keyword?: string
  tone: string
  pageType?: string
}

export async function generateMetaTags(params: GenerateMetaParams) {
  try {
    const { inputType, content, keyword, tone, pageType } = params

    // Validate input
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: "Content is required to generate meta tags.",
      }
    }

    // Create the prompt based on input type
    let prompt = ""

    if (inputType === "url") {
      prompt = `Analyze this URL and generate SEO-optimized meta tags: ${content}`
    } else {
      prompt = `Generate SEO-optimized meta tags for a ${pageType || "web page"} about: ${content}`
    }

    if (keyword && keyword.trim()) {
      prompt += `\nFocus keyword: ${keyword.trim()}`
    }

    prompt += `\nTone: ${tone}`
    prompt += `\n\nPlease provide:
1. A meta title (50-60 characters max)
2. A meta description (140-160 characters max)

Format your response as JSON with "title" and "description" fields only. Do not include any other text.`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.7,
    })

    // Parse the AI response
    let parsedResponse
    try {
      // Clean the response and extract JSON
      const cleanedText = text.trim()
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        // Fallback parsing if JSON is not properly formatted
        const lines = cleanedText.split("\n")
        let title = ""
        let description = ""

        for (const line of lines) {
          if (line.toLowerCase().includes("title") && !title) {
            title = line
              .replace(/.*title['":\s]*([^"\n]+).*/i, "$1")
              .replace(/['"]/g, "")
              .trim()
          }
          if (line.toLowerCase().includes("description") && !description) {
            description = line
              .replace(/.*description['":\s]*([^"\n]+).*/i, "$1")
              .replace(/['"]/g, "")
              .trim()
          }
        }

        parsedResponse = {
          title: title || "SEO Optimized Title",
          description: description || "SEO optimized description for better search rankings.",
        }
      }
    } catch (parseError) {
      console.error("Parse error:", parseError)
      // Fallback if parsing fails
      parsedResponse = {
        title: "SEO Optimized Title",
        description: "SEO optimized description for better search rankings and user engagement.",
      }
    }

    // Ensure we have valid strings
    if (typeof parsedResponse.title !== "string") {
      parsedResponse.title = "SEO Optimized Title"
    }
    if (typeof parsedResponse.description !== "string") {
      parsedResponse.description = "SEO optimized description for better search rankings."
    }

    // Ensure character limits
    if (parsedResponse.title.length > 60) {
      parsedResponse.title = parsedResponse.title.substring(0, 57) + "..."
    }
    if (parsedResponse.description.length > 160) {
      parsedResponse.description = parsedResponse.description.substring(0, 157) + "..."
    }

    // Store generation in database with better error handling
    try {
      await sql`
        INSERT INTO generations (
          user_email, input_type, input_content, focus_keyword, tone, 
          generated_title, generated_description
        ) VALUES (
          'anonymous@metaforge.com', ${inputType}, ${content.substring(0, 1000)}, ${(keyword || "").substring(0, 255)}, 
          ${tone}, ${parsedResponse.title}, ${parsedResponse.description}
        )
      `
    } catch (dbError) {
      console.error("Database error:", dbError)
      // Continue even if DB insert fails - don't break the user experience
    }

    return {
      success: true,
      data: parsedResponse,
    }
  } catch (error) {
    console.error("Generation error:", error)

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return {
          success: false,
          error: "API configuration error. Please try again later.",
        }
      }
      if (error.message.includes("rate limit")) {
        return {
          success: false,
          error: "Service is busy. Please try again in a moment.",
        }
      }
    }

    return {
      success: false,
      error: "Failed to generate meta tags. Please try again.",
    }
  }
}
