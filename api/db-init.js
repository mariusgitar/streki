import pg from 'pg'

const { Client } = pg

const STYLE_PROMPT = `Style: Black and white
hand-drawn illustration in a rough editorial sketch style.
Imperfect, wobbly lines with inconsistent line weight. Lines
are slightly broken and not continuous, with a few overlapping
sketch lines and small corrections. Use as few lines as
possible, but avoid clean continuous line drawing. Very minimal
detail, almost no shading. The drawing should feel quick,
slightly messy and unfinished. Large empty background.`

const SYSTEM_PROMPT = `You are an assistant that
helps create prompts for an illustration model. The user will
describe a motif and a scene in Norwegian. Translate and expand
this into a detailed English description of the motif and scene
only — what is happening, who is there, and the setting. Be
concise but vivid. Do not describe any art style. Return only
the expanded description, no explanations or extra text.`

const createJsonResponse = (res, statusCode, payload) =>
  res.status(statusCode).json(payload)

const createTables = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS images (
      id SERIAL PRIMARY KEY,
      motiv TEXT NOT NULL,
      scene TEXT NOT NULL,
      expanded_prompt TEXT NOT NULL,
      image_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await client.query(`
    CREATE TABLE IF NOT EXISTS prompts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `)
}

const seedPrompts = async (client) => {
  const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM prompts')

  if (rows[0]?.count > 0) {
    return
  }

  await client.query(
    `
      INSERT INTO prompts (name, content)
      VALUES ($1, $2), ($3, $4)
    `,
    ['style_prompt', STYLE_PROMPT, 'system_prompt', SYSTEM_PROMPT],
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return createJsonResponse(res, 405, { error: 'Method Not Allowed' })
  }

  const connectionString = process.env.NEON_DATABASE_URL

  if (!connectionString) {
    return createJsonResponse(res, 500, { error: 'Server configuration error' })
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    await client.connect()
    await client.query('BEGIN')
    await createTables(client)
    await seedPrompts(client)
    await client.query('COMMIT')

    return createJsonResponse(res, 200, { ok: true })
  } catch (error) {
    console.error('Error initializing database:', error)

    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error('Error rolling back database initialization:', rollbackError)
    }

    return createJsonResponse(res, 500, { error: 'Unable to initialize database' })
  } finally {
    try {
      await client.end()
    } catch (closeError) {
      console.error('Error closing database connection:', closeError)
    }
  }
}
