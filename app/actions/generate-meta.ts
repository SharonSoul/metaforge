"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

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

    // Create the prompt based on input type
    let prompt = ""

    if (inputType === "url") {
      prompt = `Analyze this URL and generate SEO-optimized meta tags: ${content}`
    } else {
      prompt = `Generate SEO-optimized meta tags for a ${pageType || "web page"} about: ${content}`
    }

    if (keyword) {
      prompt += `\nFocus keyword: ${keyword}`
    }

    prompt += `\nTone: ${tone}`
    prompt += `\n\nPlease provide:
1. A meta title (50-60 characters max)
2. A meta description (140-160 characters max)

Format your response as JSON with "title" and "description" fields.`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.7,
    })

    // Parse the AI response
    let parsedResponse
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        // Fallback parsing if JSON is not properly formatted
        const titleMatch = text.match(/title['":\s]*([^"\n]+)/i)
        const descMatch = text.match(/description['":\s]*([^"\n]+)/i)

        parsedResponse = {
          title: titleMatch ? titleMatch[1].replace(/['"]/g, "").trim() : "SEO Optimized Title",
          description: descMatch
            ? descMatch[1].replace(/['"]/g, "").trim()
            : "SEO optimized description for better search rankings.",
        }
      }
    } catch (parseError) {
      // Fallback if parsing fails
      parsedResponse = {
        title: "SEO Optimized Title",
        description: "SEO optimized description for better search rankings and user engagement.",
      }
    }

    // Ensure character limits
    if (parsedResponse.title.length > 60) {
      parsedResponse.title = parsedResponse.title.substring(0, 57) + "..."
    }
    if (parsedResponse.description.length > 160) {
      parsedResponse.description = parsedResponse.description.substring(0, 157) + "..."
    }

    // Store generation in database (optional - for analytics)
    try {
      await sql`
        INSERT INTO generations (
          user_email, input_type, input_content, focus_keyword, tone, 
          generated_title, generated_description
        ) VALUES (
          'anonymous@metaforge.com', ${inputType}, ${content}, ${keyword || ""}, 
          ${tone}, ${parsedResponse.title}, ${parsedResponse.description}
        )
      `
    } catch (dbError) {
      console.error("Database error:", dbError)
      // Continue even if DB insert fails
    }

    return {
      success: true,
      data: parsedResponse,
    }
  } catch (error) {
    console.error("Generation error:", error)
    return {
      success: false,
      error: "Failed to generate meta tags. Please try again.",
    }
  }
}
