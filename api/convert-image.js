import { fal } from '@fal-ai/client'
import pg from 'pg'

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

export default async function handler(req, res) {
  console.log('convert-image body:', JSON.stringify({
    hasImageBase64: !!req.body?.imageBase64,
    imageBase64Length: req.body?.imageBase64?.length,
    modeContent: req.body?.modeContent,
  }))

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
      image_url: dataUri,
      loras,
      strength: 0.85,
      num_inference_steps: 28,
    }

    console.log('fal.ai full request body:', JSON.stringify(requestBody))

    const result = await fal.subscribe('fal-ai/flux-general/image-to-image', {
      input: requestBody,
    })

    console.log('fal.ai full response:', JSON.stringify(result.data))

    const nextImageUrl = getImageUrlFromResponse(result.data)

    if (!nextImageUrl) {
      return createJsonResponse(res, 502, { error: 'fal.ai returned no image URL' })
    }

    return createJsonResponse(res, 200, { imageUrl: nextImageUrl })
  } catch (error) {
    console.error('Error converting image:', error)
    return createJsonResponse(res, 502, { error: 'Unable to reach fal.ai' })
  }
}
