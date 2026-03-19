import pg from 'pg'

const { Client } = pg

const createJsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
})

const createClient = (connectionString) =>
  new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  })

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return createJsonResponse(405, { error: 'Method Not Allowed' })
  }

  const connectionString = process.env.NEON_DATABASE_URL

  if (!connectionString) {
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
  const expandedPrompt = payload.expandedPrompt?.trim()
  const imageData = payload.imageData?.trim()

  if (!motiv || !scene || !expandedPrompt || !imageData) {
    return createJsonResponse(400, {
      error: 'Fields motiv, scene, expandedPrompt, and imageData are required',
    })
  }

  const client = createClient(connectionString)

  try {
    await client.connect()

    const result = await client.query(
      `
        INSERT INTO images (motiv, scene, expanded_prompt, image_data)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [motiv, scene, expandedPrompt, imageData],
    )

    const id = result.rows[0]?.id

    return createJsonResponse(201, { ok: true, id })
  } catch (error) {
    console.error('Error saving image:', error)
    return createJsonResponse(500, { error: 'Unable to save image' })
  } finally {
    try {
      await client.end()
    } catch (closeError) {
      console.error('Error closing database connection:', closeError)
    }
  }
}
