const SYSTEM_PROMPT = `Du er en hjelpsom assistent som lager presise
engelske bildeprompts for en illustrasjonsmodell. Svar kun med
selve prompten, ingen forklaringer eller ekstra tekst.`

const createJsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
})

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

  const motiv = payload.motiv?.trim()
  const scene = payload.scene?.trim()

  if (!motiv || !scene) {
    return createJsonResponse(400, { error: 'Fields motiv and scene are required' })
  }

  const userPrompt = `Lag et detaljert engelsk bildeprompt basert på\ndette. Motiv: ${motiv}. Scene: ${scene}.`

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const errorMessage = data?.error?.message ?? 'Failed to expand prompt'
      return createJsonResponse(response.status, { error: errorMessage })
    }

    const expandedPrompt = data?.choices?.[0]?.message?.content?.trim()

    if (!expandedPrompt) {
      return createJsonResponse(502, { error: 'OpenRouter returned an empty response' })
    }

    return createJsonResponse(200, { expandedPrompt })
  } catch (error) {
    console.error('Error expanding prompt:', error)
    return createJsonResponse(502, { error: 'Unable to reach OpenRouter' })
  }
}
