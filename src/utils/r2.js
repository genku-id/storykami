import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'albumkami';
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

/**
 * Menghapus seluruh file foto album di Cloudflare R2 untuk suatu slug (misal: "albums/dika-riyan/*")
 */
export async function deleteAlbumFolderFromR2(slug) {
  try {
    const client = getR2Client();
    const prefix = `albums/${slug}/`;
    let isTruncated = true;
    let continuationToken = undefined;
    let totalDeleted = 0;

    while (isTruncated) {
      const listCmd = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });
      const listRes = await client.send(listCmd);

      if (listRes.Contents && listRes.Contents.length > 0) {
        const deleteCmd = new DeleteObjectsCommand({
          Bucket: R2_BUCKET_NAME,
          Delete: {
            Objects: listRes.Contents.map((item) => ({ Key: item.Key })),
            Quiet: true,
          },
        });
        await client.send(deleteCmd);
        totalDeleted += listRes.Contents.length;
      }

      isTruncated = Boolean(listRes.IsTruncated);
      continuationToken = listRes.NextContinuationToken;
    }

    console.log(`[R2] Berhasil menghapus ${totalDeleted} foto untuk album ${slug}`);
    return true;
  } catch (err) {
    console.error('Failed to delete album folder from R2:', err);
    return false;
  }
}
