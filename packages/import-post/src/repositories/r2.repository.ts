import { DeleteObjectsCommand, paginateListObjectsV2, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { R2Config } from '../types.js';

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

  async listKeys(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    for await (const page of paginateListObjectsV2({ client: this.client }, { Bucket: this.bucket, Prefix: prefix })) {
      for (const object of page.Contents ?? []) {
        if (object.Key) {
          keys.push(object.Key);
        }
      }
    }
    return keys;
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }

  async deleteKeys(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })) },
      }),
    );
  }
}
