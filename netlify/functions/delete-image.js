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

  const { id } = payload

  if (id === undefined || id === null || id === '') {
    return createJsonResponse(400, { error: 'Field id is required' })
  }

  const client = createClient(connectionString)

  try {
    await client.connect()

    const result = await client.query(
      `
        DELETE FROM images
        WHERE id = $1
      `,
      [id],
    )

    if (result.rowCount === 0) {
      return createJsonResponse(404, { error: 'Image not found' })
    }

    return createJsonResponse(200, { ok: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return createJsonResponse(500, { error: 'Unable to delete image' })
  } finally {
    try {
      await client.end()
    } catch (closeError) {
      console.error('Error closing database connection:', closeError)
    }
  }
}
