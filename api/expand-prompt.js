import pg from 'pg'

const { Pool } = pg

const createJsonResponse = (res, statusCode, payload) =>
  res.status(statusCode).json(payload)

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
})

const getSystemPrompt = async () => {
  const result = await pool.query(
    "SELECT content FROM prompts WHERE name = 'system_prompt' LIMIT 1"
  )

  return result.rows[0]?.content?.trim() ?? null
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
  const motiv = payload.motiv?.trim()
  const scene = payload.scene?.trim()

  if (!motiv || !scene) {
    return createJsonResponse(res, 400, { error: 'Fields motiv and scene are required' })
  }

  const userPrompt = `Lag et detaljert engelsk bildeprompt basert på\ndette. Motiv: ${motiv}. Scene: ${scene}.`

  try {
    const systemPrompt = await getSystemPrompt()

    if (!systemPrompt) {
      return createJsonResponse(res, 500, {
        error: "Missing prompt content for name 'system_prompt' in prompts table",
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
        messages: [
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
