// app/api/generate-design/route.ts
import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import type { SubmitDesignData } from '../../lib/types'

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
})

function createPromptWithReference(description: string, hasReferenceImage: boolean): string {
  // Base prompt structure
  let prompt = `Create a new clothing item based on this description: ${description}.`

  // Add reference image context if provided
  if (hasReferenceImage) {
    prompt += `
    Use the reference image as inspiration for:
    - Overall style and aesthetic
    - Similar silhouette and proportions
    - Comparable fabric texture and draping
    - Related design elements and details
    - Similar photography style

    However, create a unique piece that combines these elements with the specific requirements from the description.
    `
  }

  // Add photography specifications
  prompt += `
  Present the final design as a professional product photograph:
  - Clean white or light gray background
  - Studio-quality lighting to highlight fabric texture and details
  - Sharp, clear, high-resolution image
  - Professional fashion photography style
  - Multiple angles if possible
  - Photorealistic rendering
  - HD quality
  The final image should look like a high-end fashion e-commerce product photo.`

  return prompt
}

export async function POST(req: Request) {
  if (!process.env['OPENAI_API_KEY']) {
    console.error('OpenAI API key is missing from environment variables')
    return NextResponse.json(
      { error: 'OpenAI API key not configured in Replit secrets' },
      { status: 500 }
    )
  }

  try {
    let body: SubmitDesignData
    try {
      body = await req.json()
    } catch (e) {
      console.error('Error parsing request body:', e)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { description, referenceImage } = body

    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    const prompt = createPromptWithReference(description, !!referenceImage)
    console.log('Sending prompt to OpenAI:', prompt)

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        style: "natural"
      })

      console.log('OpenAI API Response:', JSON.stringify(response, null, 2))

      if (!response.data || response.data.length === 0) {
        throw new Error('No images generated')
      }

      return NextResponse.json({
        designs: response.data
      })

    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError)

      if (openaiError instanceof Error) {
        if (openaiError.message.includes('rate limit')) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
          )
        }
        if (openaiError.message.includes('content policy')) {
          return NextResponse.json(
            { error: 'Content policy violation. Please modify your request.' },
            { status: 400 }
          )
        }
      }

      return NextResponse.json(
        { error: 'Error generating image with OpenAI' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}