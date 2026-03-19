const STYLE_PROMPT = `Style: Black and white hand-drawn
illustration in a rough editorial sketch style. Imperfect, wobbly
lines with inconsistent line weight. Lines are slightly broken and
not continuous, with a few overlapping sketch lines and small
corrections. Use as few lines as possible, but avoid clean
continuous line drawing. Very minimal detail, almost no shading.
The drawing should feel quick, slightly messy and unfinished.
Large empty background.`

const createJsonResponse = (res, statusCode, payload) =>
  res.status(statusCode).json(payload)

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

  const payload = req.body ?? {}
  const expandedPrompt = payload.expandedPrompt?.trim()

  if (!expandedPrompt) {
    return createJsonResponse(res, 400, { error: 'Field expandedPrompt is required' })
  }

  const prompt = `${expandedPrompt}\n\n${STYLE_PROMPT}`

  try {
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
