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
  if (req.method !== 'GET') {
    return createJsonResponse(res, 405, { error: 'Method Not Allowed' })
  }

  const connectionString = process.env.NEON_DATABASE_URL

  if (!connectionString) {
    return createJsonResponse(res, 500, { error: 'Server configuration error' })
  }

  const client = createClient(connectionString)

  try {
    await client.connect()

    const result = await client.query(
      `
        SELECT name, content, strength
        FROM prompts
        WHERE name LIKE 'convert_%'
        ORDER BY name ASC
      `,
    )

    return createJsonResponse(res, 200, { modes: result.rows })
  } catch (error) {
    console.error('Error fetching convert modes:', error)
    return createJsonResponse(res, 500, { error: 'Unable to fetch convert modes' })
  } finally {
    try {
      await client.end()
    } catch (closeError) {
      console.error('Error closing database connection:', closeError)
    }
  }
}
