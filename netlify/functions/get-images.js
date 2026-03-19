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
  if (event.httpMethod !== 'GET') {
    return createJsonResponse(405, { error: 'Method Not Allowed' })
  }

  const connectionString = process.env.NEON_DATABASE_URL

  if (!connectionString) {
    return createJsonResponse(500, { error: 'Server configuration error' })
  }

  const client = createClient(connectionString)

  try {
    await client.connect()

    const result = await client.query(`
      SELECT id, motiv, scene, expanded_prompt, image_data, created_at
      FROM images
      ORDER BY created_at DESC
    `)

    return createJsonResponse(200, { images: result.rows })
  } catch (error) {
    console.error('Error fetching images:', error)
    return createJsonResponse(500, { error: 'Unable to fetch images' })
  } finally {
    try {
      await client.end()
    } catch (closeError) {
      console.error('Error closing database connection:', closeError)
    }
  }
}
