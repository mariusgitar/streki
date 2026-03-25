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

const normalizeBase64 = (value) => {
  if (!value) {
    return ''
  }

  const trimmed = value.trim()
  const commaIndex = trimmed.indexOf(',')

  if (trimmed.startsWith('data:image') && commaIndex !== -1) {
    return trimmed.slice(commaIndex + 1)
  }

  return trimmed
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return createJsonResponse(res, 405, { error: 'Method Not Allowed' })
  }

  const connectionString = process.env.NEON_DATABASE_URL

  if (!connectionString) {
    return createJsonResponse(res, 500, { error: 'Server configuration error' })
  }

  const client = createClient(connectionString)
  const errors = []
  let migrated = 0

  try {
    await client.connect()

    const result = await client.query(
      `
        SELECT id, image_url
        FROM images
        WHERE image_url IS NOT NULL
          AND image_url NOT LIKE 'https://%'
        ORDER BY id ASC
      `,
    )

    for (const row of result.rows) {
      const id = row.id

      try {
        const base64Image = normalizeBase64(row.image_url)

        if (!base64Image) {
          throw new Error('Mangler base64-data i image_url')
        }

        const fileName = `images/migrated-${id}-${Date.now()}.png`
        const uploadedUrl = await uploadToR2({
          imageBase64: base64Image,
          fileName,
        })

        await client.query(
          `
            UPDATE images
            SET image_url = $1
            WHERE id = $2
          `,
          [uploadedUrl, id],
        )

        migrated += 1
        console.log(`Migrated image ${id}: ${uploadedUrl}`)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Ukjent feil under migrering'

        errors.push({ id, error: message })
        console.error(`Failed to migrate image ${id}:`, error)
      }
    }

    return createJsonResponse(res, 200, { migrated, errors })
  } catch (error) {
    console.error('Error migrating images:', error)
    return createJsonResponse(res, 500, {
      error: 'Unable to migrate images',
      migrated,
      errors,
    })
  } finally {
    try {
      await client.end()
    } catch (closeError) {
      console.error('Error closing database connection:', closeError)
    }
  }
}
