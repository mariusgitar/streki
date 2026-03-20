import pg from 'pg'

const { Client } = pg

const createJsonResponse = (res, statusCode, payload) =>
  res.status(statusCode).json(payload)

const createClient = (connectionString) =>
  new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return createJsonResponse(res, 405, { error: 'Method Not Allowed' })
  }

  const connectionString = process.env.NEON_DATABASE_URL

  if (!connectionString) {
    return createJsonResponse(res, 500, { error: 'Server configuration error' })
  }

  const payload = req.body ?? {}
  const motiv = payload.motiv?.trim()
  const scene = payload.scene?.trim()
  const expandedPrompt = payload.expandedPrompt?.trim()
  const imageUrl = payload.imageUrl?.trim()

  if (!motiv || !scene || !expandedPrompt || !imageUrl) {
    return createJsonResponse(res, 400, {
      error: 'Fields motiv, scene, expandedPrompt, and imageUrl are required',
    })
  }

  const client = createClient(connectionString)

  try {
    await client.connect()

    const imageResponse = await fetch(imageUrl)

    if (!imageResponse.ok) {
      throw new Error(`Unable to fetch image: ${imageResponse.status}`)
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
    const imageData = imageBuffer.toString('base64')

    const result = await client.query(
      `
        INSERT INTO images (motiv, scene, expanded_prompt, image_data)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [motiv, scene, expandedPrompt, imageData],
    )

    const id = result.rows[0]?.id

    return createJsonResponse(res, 201, { ok: true, id })
  } catch (error) {
    console.error('Error saving image:', error)
    return createJsonResponse(res, 500, { error: 'Unable to save image' })
  } finally {
    try {
      await client.end()
    } catch (closeError) {
      console.error('Error closing database connection:', closeError)
    }
  }
}
