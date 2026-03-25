import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

export async function uploadToR2({ imageBase64, fileName }) {
  try {
    if (!imageBase64 || !fileName) {
      throw new Error('uploadToR2 krever både imageBase64 og fileName')
    }

    const client = new S3Client({
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      region: 'auto',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    })

    const buffer = Buffer.from(imageBase64, 'base64')

    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: 'image/png',
      }),
    )

    return `${process.env.R2_PUBLIC_URL}/${fileName}`
  } catch (error) {
    throw new Error(
      `Kunne ikke laste opp bilde til Cloudflare R2: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
