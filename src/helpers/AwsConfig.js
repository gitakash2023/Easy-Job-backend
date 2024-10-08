import dotenv from 'dotenv';
import { S3Client } from '@aws-sdk/client-s3';
dotenv.config();
const accessKey = process.env.ACCESS_KEY_S3_BUCKET;
const secretAccessKey = process.env.SECRET_ACCESS_KEY_S3_BUKCET;
const region = process.env.REGION;
export const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
});
