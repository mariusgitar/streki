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
  const { id } = payload

  if (id === undefined || id === null || id === '') {
    return createJsonResponse(res, 400, { error: 'Field id is required' })
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
      return createJsonResponse(res, 404, { error: 'Image not found' })
    }

    return createJsonResponse(res, 200, { ok: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return createJsonResponse(res, 500, { error: 'Unable to delete image' })
  } finally {
    try {
      await client.end()
    } catch (closeError) {
      console.error('Error closing database connection:', closeError)
    }
  }
}
