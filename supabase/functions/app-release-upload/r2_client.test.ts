import { GetObjectCommand, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3.899.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.899.0';
import assert from 'node:assert/strict';
import { createR2Client } from './r2_client.mjs';

Deno.test('presigned staging URLs meet validator and upload contracts', async () => {
  const account = 'a'.repeat(32);
  const bucket = 'freelan-space-apk';
  const key = 'staging/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.apk';
  const client = createR2Client(account, {accessKeyId: 'synthetic', secretAccessKey: 'synthetic'});
  try {
    const download = new URL(await getSignedUrl(client, new GetObjectCommand({
      Bucket: bucket, Key: key, IfMatch: '"etag"',
    }), {expiresIn: 300}));
    assert.equal(download.protocol, 'https:');
    assert.equal(download.host, `${account}.r2.cloudflarestorage.com`);
    assert.equal(download.pathname, `/${bucket}/${key}`);
    assert.ok(download.searchParams.get('X-Amz-SignedHeaders')?.split(';').includes('if-match'));

    const upload = new URL(await getSignedUrl(client, new PutObjectCommand({
      Bucket: bucket, Key: key, ContentLength: 100,
      ContentType: 'application/vnd.android.package-archive', IfNoneMatch: '*',
    }), {expiresIn: 900, signableHeaders: new Set(['content-length', 'content-type', 'if-none-match'])}));
    assert.equal(upload.host, `${account}.r2.cloudflarestorage.com`);
    assert.equal(upload.pathname, `/${bucket}/${key}`);
    const signedHeaders = upload.searchParams.get('X-Amz-SignedHeaders')?.split(';') ?? [];
    for (const header of ['content-length', 'content-type', 'if-none-match']) {
      assert.ok(signedHeaders.includes(header), `${header} must be signed`);
    }
  } finally {
    client.destroy();
  }
});
