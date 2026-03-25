import pg from 'pg'

const { Pool } = pg

const createJsonResponse = (res, statusCode, payload) =>
  res.status(statusCode).json(payload)

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
})

const getSystemPrompt = async (mode) => {
  const promptName = mode === 'expand' ? 'system_prompt_expand' : 'system_prompt'
  const result = await pool.query('SELECT content FROM prompts WHERE name = $1 LIMIT 1', [promptName])

  return {
    promptName,
    content: result.rows[0]?.content?.trim() ?? null,
  }
}

const getVisionPrompt = async () => {
  const promptName = 'experimental_vision_prompt'
  const result = await pool.query('SELECT content FROM prompts WHERE name = $1 LIMIT 1', [promptName])

  return {
    promptName,
    content: result.rows[0]?.content?.trim() ?? null,
  }
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
  const beskrivelse = payload.beskrivelse?.trim()
  const mode = typeof payload.mode === 'string' ? payload.mode.trim() : ''
  const imageBase64Input = typeof payload.imageBase64 === 'string' ? payload.imageBase64.trim() : ''
  const imageBase64 = imageBase64Input.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
  const hasImageInput = Boolean(imageBase64)

  if (!beskrivelse && !hasImageInput) {
    return createJsonResponse(res, 400, { error: 'Either beskrivelse or imageBase64 is required' })
  }

  const userPrompt = `Translate and expand this into a detailed English description for an illustration. Description: ${beskrivelse}`

  try {
    const { promptName, content: systemPrompt } = hasImageInput
      ? await getVisionPrompt()
      : await getSystemPrompt(mode)

    if (!systemPrompt) {
      return createJsonResponse(res, 500, {
        error: `Missing prompt content for name '${promptName}' in prompts table`,
      })
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: hasImageInput
          ? [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ]
          : [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
      }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const errorMessage = data?.error?.message ?? 'Failed to expand prompt'
      return createJsonResponse(res, response.status, { error: errorMessage })
    }

    const expandedPrompt = data?.choices?.[0]?.message?.content?.trim()

    if (!expandedPrompt) {
      return createJsonResponse(res, 502, { error: 'OpenRouter returned an empty response' })
    }

    return createJsonResponse(res, 200, { expandedPrompt })
  } catch (error) {
    console.error('Error expanding prompt:', error)
    return createJsonResponse(res, 502, { error: 'Unable to reach OpenRouter' })
  }
}
