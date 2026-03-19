const createJsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
})

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

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return createJsonResponse(405, { error: 'Method Not Allowed' })
  }

  const apiKey = process.env.STREKI_OPEN_ROUTER_KEY

  if (!apiKey) {
    return createJsonResponse(500, { error: 'Server configuration error' })
  }

  let payload

  try {
    payload = JSON.parse(event.body ?? '{}')
  } catch {
    return createJsonResponse(400, { error: 'Invalid JSON body' })
  }

  const expandedPrompt = payload.expandedPrompt?.trim()

  if (!expandedPrompt) {
    return createJsonResponse(400, { error: 'Field expandedPrompt is required' })
  }

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
            content: expandedPrompt,
          },
        ],
      }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const errorMessage = data?.error?.message ?? 'Failed to generate image'
      return createJsonResponse(response.status, { error: errorMessage })
    }

    const imageUrl = getImageUrlFromResponse(data)

    if (!imageUrl) {
      return createJsonResponse(502, { error: 'OpenRouter returned no image URL' })
    }

    return createJsonResponse(200, { imageUrl })
  } catch (error) {
    console.error('Error generating image:', error)
    return createJsonResponse(502, { error: 'Unable to reach OpenRouter' })
  }
}
