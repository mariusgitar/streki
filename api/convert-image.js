import pg from 'pg'

const { Pool } = pg

const createJsonResponse = (res, statusCode, payload) =>
  res.status(statusCode).json(payload)

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
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

const parseBase64Image = (imageBase64) => {
  const matches = imageBase64.match(/^data:(.+?);base64,(.+)$/)
  const mimeType = matches?.[1] ?? 'image/jpeg'
  const base64Content = matches?.[2] ?? imageBase64
  const extension = mimeType.split('/')[1] ?? 'jpg'

  return {
    buffer: Buffer.from(base64Content, 'base64'),
    mimeType,
    filename: `image.${extension}`,
  }
}

const uploadImageToFalStorage = async (imageBase64) => {
  const { buffer, mimeType, filename } = parseBase64Image(imageBase64)
  const formData = new FormData()
  const blob = new Blob([buffer], { type: mimeType })

  formData.append('file', blob, filename)

  const uploadResponse = await fetch('https://fal.run/storage/upload', {
    method: 'POST',
    headers: {
      Authorization: `Key ${process.env.STREKI_FAL_API_KEY}`,
    },
    body: formData,
  })

  const uploadData = await uploadResponse.json().catch(() => null)

  if (!uploadResponse.ok) {
    const errorMessage =
      uploadData?.detail ??
      uploadData?.error?.message ??
      uploadData?.error ??
      'Failed to upload image to fal.ai storage'

    throw new Error(errorMessage)
  }

  if (!uploadData?.url) {
    throw new Error('fal.ai storage upload returned no URL')
  }

  return uploadData.url
}

export default async function handler(req, res) {
  console.log('convert-image body:', JSON.stringify({
    hasImageBase64: !!req.body?.imageBase64,
    imageBase64Length: req.body?.imageBase64?.length,
    modeContent: req.body?.modeContent,
    modeStrength: req.body?.modeStrength,
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
  const modeStrength = Number(payload.modeStrength)

  if (!imageBase64 || !modeContent || Number.isNaN(modeStrength)) {
    return createJsonResponse(res, 400, {
      error: 'Fields imageBase64, modeContent, and modeStrength are required',
    })
  }

  try {
    const stylePrompt = await getStylePrompt()

    if (!stylePrompt) {
      return createJsonResponse(res, 500, {
        error: "Missing prompt content for name 'style_prompt' in prompts table",
      })
    }

    const fullPrompt = `${modeContent}\n\n${stylePrompt}`
    const imageUrl = await uploadImageToFalStorage(imageBase64)

    console.log('fal.ai request:', JSON.stringify({
      prompt: fullPrompt?.substring(0, 100),
      strength: modeStrength,
      hasImageUrl: !!imageUrl,
    }))

    const response = await fetch('https://fal.run/fal-ai/flux-2/klein/4b/lora', {
      method: 'POST',
      headers: {
        Authorization: `Key ${process.env.STREKI_FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        image_url: imageUrl,
        strength: modeStrength,
        loras: [
          {
            path: 'https://v3b.fal.media/files/b/0a92e984/0Vyp4Z-SZOz7Hk83YwYvC_pytorch_lora_weights.safetensors',
            scale: 1.0,
          },
        ],
        num_inference_steps: 8,
      }),
    })

    const data = await response.json().catch(() => null)

    console.log('fal.ai full response:', JSON.stringify(data))

    if (!response.ok) {
      const errorMessage =
        data?.detail ??
        data?.error?.message ??
        data?.error ??
        'Failed to convert image'

      return createJsonResponse(res, response.status, { error: errorMessage })
    }

    const nextImageUrl = getImageUrlFromResponse(data)

    if (!nextImageUrl) {
      return createJsonResponse(res, 502, { error: 'fal.ai returned no image URL' })
    }

    return createJsonResponse(res, 200, { imageUrl: nextImageUrl })
  } catch (error) {
    console.error('Error converting image:', error)
    return createJsonResponse(res, 502, { error: 'Unable to reach fal.ai' })
  }
}
