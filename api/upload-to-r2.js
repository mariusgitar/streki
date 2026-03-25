import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const getRequiredEnv = (name) => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing ${name} configuration`)
  }

  return value
}

const createR2Client = () => {
  const accountId = getRequiredEnv('R2_ACCOUNT_ID')
  const accessKeyId = getRequiredEnv('R2_ACCESS_KEY_ID')
  const secretAccessKey = getRequiredEnv('R2_SECRET_ACCESS_KEY')

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

export async function uploadToR2({ imageBase64, fileName }) {
  if (!imageBase64 || !fileName) {
    throw new Error('Fields imageBase64 and fileName are required')
  }

  const bucketName = getRequiredEnv('R2_BUCKET_NAME')
  const publicUrl = getRequiredEnv('R2_PUBLIC_URL').replace(/\/$/, '')
  const imageBuffer = Buffer.from(imageBase64, 'base64')
  const client = createR2Client()

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: imageBuffer,
      ContentType: 'image/png',
    }),
  )

  return `${publicUrl}/${fileName}`
}
