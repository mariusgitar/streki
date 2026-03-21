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
  const name = payload.name?.trim()
  const content = payload.content?.trim()
  const isConvertPrompt = typeof name === 'string' && name.startsWith('convert_')
  const strength = isConvertPrompt ? Number(payload.strength) : null

  if (!name || !content) {
    return createJsonResponse(res, 400, { error: 'Fields name and content are required' })
  }

  if (isConvertPrompt && (!Number.isFinite(strength) || strength < 0.1 || strength > 1)) {
    return createJsonResponse(res, 400, { error: 'Field strength must be a number between 0.1 and 1.0' })
  }

  const client = createClient(connectionString)

  try {
    await client.connect()

    const result = await client.query(
      `
        UPDATE prompts
        SET content = $2,
            strength = $3,
            updated_at = NOW()
        WHERE name = $1
      `,
      [name, content, strength],
    )

    if (result.rowCount === 0) {
      return createJsonResponse(res, 404, { error: 'Prompt not found' })
    }

    return createJsonResponse(res, 200, { ok: true })
  } catch (error) {
    console.error('Error updating prompt:', error)
    return createJsonResponse(res, 500, { error: 'Unable to update prompt' })
  } finally {
    try {
      await client.end()
    } catch (closeError) {
      console.error('Error closing database connection:', closeError)
    }
  }
}
