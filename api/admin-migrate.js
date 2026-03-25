import pg from 'pg'
import { uploadToR2 } from './upload-to-r2.js'

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

const getBase64FromImageUrl = (imageUrl) => {
  if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
    return null
  }

  if (imageUrl.startsWith('data:')) {
    const parts = imageUrl.split(',')
    return parts[1] || null
  }

  return imageUrl
}

const createFileName = (id) => `images/migrated-${id}-${Date.now()}-${Math.random().toString(36).slice(2)}.png`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return createJsonResponse(res, 405, { error: 'Method Not Allowed' })
  }

  const connectionString = process.env.NEON_DATABASE_URL

  if (!connectionString) {
    return createJsonResponse(res, 500, { error: 'Server configuration error' })
  }

  const client = createClient(connectionString)

  let migrated = 0
  let errors = 0

  try {
    await client.connect()

    const imagesResult = await client.query(`
      SELECT id, image_url
      FROM images
      WHERE image_url IS NOT NULL
        AND image_url <> ''
        AND image_url NOT LIKE 'https://%'
      ORDER BY id ASC
    `)

    for (const image of imagesResult.rows) {
      try {
        const imageBase64 = getBase64FromImageUrl(image.image_url)

        if (!imageBase64) {
          throw new Error('Manglende base64-data for bilde')
        }

        const r2Url = await uploadToR2({
          imageBase64,
          fileName: createFileName(image.id),
        })

        await client.query(
          `
            UPDATE images
            SET image_url = $1
            WHERE id = $2
          `,
          [r2Url, image.id],
        )

        migrated += 1
      } catch (error) {
        errors += 1
        console.error(`Error migrating image ${image.id}:`, error)
      }
    }

    return createJsonResponse(res, 200, { migrated, errors })
  } catch (error) {
    console.error('Error migrating images:', error)
    return createJsonResponse(res, 500, { error: 'Unable to migrate images' })
  } finally {
    try {
      await client.end()
    } catch (closeError) {
      console.error('Error closing database connection:', closeError)
    }
  }
}
