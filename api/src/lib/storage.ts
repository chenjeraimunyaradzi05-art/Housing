// S3 Storage Service for VÖR Platform
// Uses AWS S3 for file storage with signed URLs

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';

const S3_BUCKET = process.env.AWS_S3_BUCKET || 'vor-platform-dev';
const S3_REGION = process.env.AWS_S3_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Initialize S3 client
const s3Client = new S3Client({
  region: S3_REGION,
  credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      }
    : undefined, // Use IAM role if no credentials provided
});

/**
 * Upload a file to S3
 * @param buffer - File buffer
 * @param key - S3 object key (path)
 * @param contentType - MIME type
 * @returns Public URL of the uploaded file
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  // In development without S3, return a placeholder URL
  if (!AWS_ACCESS_KEY_ID || process.env.NODE_ENV === 'development') {
    console.log(`📦 S3 Upload (mock): ${key}`);
    return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
  }

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read', // Make publicly accessible
  });

  await s3Client.send(command);

  // Return the public URL
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}

/**
 * Delete a file from S3
 * @param key - S3 object key (path)
 */
export async function deleteFromS3(key: string): Promise<void> {
  // In development without S3, just log
  if (!AWS_ACCESS_KEY_ID || process.env.NODE_ENV === 'development') {
    console.log(`🗑️ S3 Delete (mock): ${key}`);
    return;
  }

  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Get a signed URL for private file access
 * @param key - S3 object key (path)
 * @param expiresIn - URL expiration in seconds (default: 1 hour)
 * @returns Signed URL
 */
export async function getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  // In development without S3, return mock URL
  if (!AWS_ACCESS_KEY_ID || process.env.NODE_ENV === 'development') {
    console.log(`🔗 S3 Signed URL (mock): ${key}`);
    return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}?signed=mock`;
  }

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  return getS3SignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a presigned URL for direct upload from client
 * @param key - S3 object key (path)
 * @param contentType - MIME type
 * @param expiresIn - URL expiration in seconds (default: 5 minutes)
 * @returns Presigned upload URL
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 300
): Promise<string> {
  // In development without S3, return mock URL
  if (!AWS_ACCESS_KEY_ID || process.env.NODE_ENV === 'development') {
    console.log(`📤 S3 Presigned Upload URL (mock): ${key}`);
    return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}?upload=mock`;
  }

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getS3SignedUrl(s3Client, command, { expiresIn });
}
