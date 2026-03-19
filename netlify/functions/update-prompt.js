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

  const name = payload.name?.trim()
  const content = payload.content?.trim()

  if (!name || !content) {
    return createJsonResponse(400, { error: 'Fields name and content are required' })
  }

  const client = createClient(connectionString)

  try {
    await client.connect()

    const result = await client.query(
      `
        UPDATE prompts
        SET content = $2, updated_at = NOW()
        WHERE name = $1
      `,
      [name, content],
    )

    if (result.rowCount === 0) {
      return createJsonResponse(404, { error: 'Prompt not found' })
    }

    return createJsonResponse(200, { ok: true })
  } catch (error) {
    console.error('Error updating prompt:', error)
    return createJsonResponse(500, { error: 'Unable to update prompt' })
  } finally {
    try {
      await client.end()
    } catch (closeError) {
      console.error('Error closing database connection:', closeError)
    }
  }
}
