import pg from 'pg'

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

const getImageUrlFromResponse = (data) => {
  const message = data?.choices?.[0]?.message

  if (!message) {
    return null
  }

  const imageFromArray = message.images?.[0]

  return (
    imageFromArray?.image_url?.url ??
    imageFromArray?.imageUrl?.url ??
    message.image_url?.url ??
    message.imageUrl?.url ??
    null
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return createJsonResponse(res, 405, { error: 'Method Not Allowed' })
  }

  const apiKey = process.env.STREKI_OPEN_ROUTER_KEY

  if (!apiKey) {
    return createJsonResponse(res, 500, { error: 'Server configuration error' })
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

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/flux.2-klein-4b',
        modalities: ['image'],
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const errorMessage = data?.error?.message ?? 'Failed to generate image'
      return createJsonResponse(res, response.status, { error: errorMessage })
    }

    const imageUrl = getImageUrlFromResponse(data)

    if (!imageUrl) {
      return createJsonResponse(res, 502, { error: 'OpenRouter returned no image URL' })
    }

    return createJsonResponse(res, 200, { imageUrl })
  } catch (error) {
    console.error('Error generating image:', error)
    return createJsonResponse(res, 502, { error: 'Unable to reach OpenRouter' })
  }
}
