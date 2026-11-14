import { S3Client } from 'npm:@aws-sdk/client-s3@3.899.0';

export function createR2Client(account, credentials) {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${account}.r2.cloudflarestorage.com`,
    credentials,
    // The validator accepts only the account host and bucket-prefixed path.
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
  });
}
