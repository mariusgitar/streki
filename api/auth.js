const createJsonResponse = (res, statusCode, payload) => res.status(statusCode).json(payload)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return createJsonResponse(res, 405, { error: 'Method Not Allowed' })
  }

  const expectedPassword = process.env.PASSWORD_KEY

  if (!expectedPassword) {
    return createJsonResponse(res, 500, { error: 'Missing PASSWORD_KEY configuration' })
  }

  const payload = req.body ?? {}
  const password = payload.password?.trim()

  if (!password) {
    return createJsonResponse(res, 401, { error: 'Invalid password' })
  }

  if (password !== expectedPassword) {
    return createJsonResponse(res, 401, { error: 'Invalid password' })
  }

  return createJsonResponse(res, 200, { ok: true })
}
