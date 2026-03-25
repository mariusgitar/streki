import pg from 'pg'
import { uploadToR2 } from './upload-to-r2'

const { Pool } = pg

const createJsonResponse = (res, statusCode, payload) =>
  res.status(statusCode).json(payload)

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
})

const getStylePrompt = async () => {
  const result = await pool.query(
    "SELECT content FROM prompts WHERE name = 'style_prompt' LIMIT 1"
  )

  return result.rows[0]?.content?.trim() ?? null
}

const getImageUrlFromResponse = (data) =>
  data?.images?.[0]?.url ??
  data?.data?.images?.[0]?.url ??
  data?.image?.url ??
  data?.url ??
  null

const createFileName = () => `images/${Date.now()}-${Math.random().toString(36).slice(2)}.png`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return createJsonResponse(res, 405, { error: 'Method Not Allowed' })
  }

  if (!process.env.STREKI_FAL_API_KEY) {
    return createJsonResponse(res, 500, { error: 'Missing STREKI_FAL_API_KEY configuration' })
  }

  if (!process.env.NEON_DATABASE_URL) {
    return createJsonResponse(res, 500, { error: 'Missing NEON_DATABASE_URL configuration' })
  }

  const payload = req.body ?? {}
  const expandedPrompt = payload.expandedPrompt?.trim()

  if (!expandedPrompt) {
    return createJsonResponse(res, 400, { error: 'Field expandedPrompt is required' })
  }

  try {
    const stylePrompt = await getStylePrompt()

    if (!stylePrompt) {
      return createJsonResponse(res, 500, {
        error: "Missing prompt content for name 'style_prompt' in prompts table",
      })
    }

    const prompt = `${expandedPrompt}\n\n${stylePrompt}`

    const response = await fetch('https://fal.run/fal-ai/flux-lora', {
      method: 'POST',
      headers: {
        Authorization: `Key ${process.env.STREKI_FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        loras: [
          {
            path: 'https://v3b.fal.media/files/b/0a92e984/0Vyp4Z-SZOz7Hk83YwYvC_pytorch_lora_weights.safetensors',
            scale: 1.0,
          },
        ],
        image_size: 'square_hd',
      }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const errorMessage =
        data?.detail ??
        data?.error?.message ??
        data?.error ??
        'Failed to generate image'

      return createJsonResponse(res, response.status, { error: errorMessage })
    }

    const falImageUrl = getImageUrlFromResponse(data)

    if (!falImageUrl) {
      return createJsonResponse(res, 502, { error: 'fal.ai returned no image URL' })
    }

    const imageResponse = await fetch(falImageUrl)

    if (!imageResponse.ok) {
      return createJsonResponse(res, 502, { error: 'Unable to download image from fal.ai' })
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
    const imageBase64 = imageBuffer.toString('base64')
    const r2Url = await uploadToR2({
      imageBase64,
      fileName: createFileName(),
    })

    return createJsonResponse(res, 200, { imageUrl: r2Url })
  } catch (error) {
    console.error('Error generating image:', error)
    return createJsonResponse(res, 502, { error: 'Unable to reach fal.ai' })
  }
}
