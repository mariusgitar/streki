import { fal } from '@fal-ai/client'
import pg from 'pg'
import { uploadToR2 } from './upload-to-r2.js'

const { Pool } = pg

const createJsonResponse = (res, statusCode, payload) =>
  res.status(statusCode).json(payload)

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
})

fal.config({
  credentials: process.env.STREKI_FAL_API_KEY,
})

const getStylePrompt = async () => {
  const result = await pool.query("SELECT content FROM prompts WHERE name = 'style_prompt' LIMIT 1")

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
  const imageBase64 = payload.imageBase64?.trim()
  const modeContent = payload.modeContent?.trim()

  if (!imageBase64 || !modeContent) {
    return createJsonResponse(res, 400, {
      error: 'Fields imageBase64 and modeContent are required',
    })
  }

  try {
    const stylePrompt = await getStylePrompt()

    if (!stylePrompt) {
      return createJsonResponse(res, 500, {
        error: "Missing prompt content for name 'style_prompt' in prompts table",
      })
    }

    const promptIncludesStylePrompt = modeContent.includes(stylePrompt)
    const fullPrompt = promptIncludesStylePrompt
      ? modeContent
      : `${modeContent}\n\n${stylePrompt}`
    const dataUri = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`
    const loras = [
      {
        path: 'https://v3b.fal.media/files/b/0a92e984/0Vyp4Z-SZOz7Hk83YwYvC_pytorch_lora_weights.safetensors',
        scale: 1.0,
      },
    ]

    const requestBody = {
      prompt: fullPrompt,
      model_name: null,
      image_urls: [dataUri],
      loras,
      embeddings: [],
      guidance_scale: 7,
      num_inference_steps: 28,
    }

    const result = await fal.subscribe('fal-ai/flux-2/klein/4b/base/edit/lora', {
      input: requestBody,
    })

    const falImageUrl = getImageUrlFromResponse(result.data)

    if (!falImageUrl) {
      return createJsonResponse(res, 502, { error: 'fal.ai returned no image URL' })
    }

    const imageResponse = await fetch(falImageUrl)

    if (!imageResponse.ok) {
      return createJsonResponse(res, 502, { error: 'Unable to download image from fal.ai' })
    }

    const nextImageBuffer = Buffer.from(await imageResponse.arrayBuffer())
    const nextImageBase64 = nextImageBuffer.toString('base64')
    const r2Url = await uploadToR2({
      imageBase64: nextImageBase64,
      fileName: createFileName(),
    })

    return createJsonResponse(res, 200, { imageUrl: r2Url })
  } catch (error) {
    console.error('Error converting image:', error)
    return createJsonResponse(res, 502, { error: 'Unable to reach fal.ai' })
  }
}
