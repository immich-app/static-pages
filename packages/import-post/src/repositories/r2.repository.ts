import { DeleteObjectsCommand, paginateListObjectsV2, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { BucketObject, R2Config } from '../types.js';

export class R2Repository {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: R2Config) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async listObjects(prefix: string): Promise<BucketObject[]> {
    const objects: BucketObject[] = [];
    for await (const page of paginateListObjectsV2({ client: this.client }, { Bucket: this.bucket, Prefix: prefix })) {
      for (const { Key, LastModified } of page.Contents ?? []) {
        if (Key && LastModified) {
          objects.push({ key: Key, lastModified: LastModified });
        }
      }
    }
    return objects;
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }

  async deleteKeys(keys: string[]): Promise<void> {
    // DeleteObjects takes at most 1000 keys per request
    for (let start = 0; start < keys.length; start += 1000) {
      const Objects = keys.slice(start, start + 1000).map((Key) => ({ Key }));
      await this.client.send(new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects } }));
    }
  }
}
