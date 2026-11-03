import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'storykami-albums';
const R2_PUBLIC_DOMAIN = (process.env.R2_PUBLIC_DOMAIN || '').replace(/\/$/, '');

let s3ClientInstance = null;

export function getR2Client() {
  if (!s3ClientInstance) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      console.warn('[R2] Warning: Cloudflare R2 credentials are not set in .env.local');
    }

    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3ClientInstance;
}

/**
 * Menghasilkan Presigned PUT URL agar browser tamu dapat mengunggah foto langsung ke Cloudflare R2
 * @param {string} key - path file di R2 (misal: "albums/dika-riyan/1730600000_photo.webp")
 * @param {string} contentType - mime type foto (default: 'image/webp')
 * @param {number} expiresIn - masa berlaku token presigned (detik)
 */
export async function createPresignedUploadUrl(key, contentType = 'image/webp', expiresIn = 300) {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  const publicUrl = R2_PUBLIC_DOMAIN ? `${R2_PUBLIC_DOMAIN}/${key}` : uploadUrl.split('?')[0];

  return { uploadUrl, publicUrl, key };
}

/**
 * Mendapatkan Public URL dari suatu object key di R2
 */
export function getR2PublicUrl(key) {
  if (R2_PUBLIC_DOMAIN) {
    return `${R2_PUBLIC_DOMAIN}/${key}`;
  }
  return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
}
