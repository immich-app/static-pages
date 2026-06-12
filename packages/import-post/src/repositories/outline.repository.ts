import type { OutlineDocument } from '../types.js';

export class OutlineRepository {
  private readonly authHeader: string;

  constructor(apiKey: string) {
    this.authHeader = `Bearer ${apiKey}`;
  }

  async getDocument(postUrl: string): Promise<OutlineDocument> {
    const parts = new URL(postUrl);
    const postId = parts.pathname.replace(/^\/doc\//, '').replace(/\/+$/, '');
    const apiUrl = new URL('/api/documents.info', parts).toString();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { Authorization: this.authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId }),
    });
    if (!response.ok) {
      throw new Error(`Outline API error (${response.status} ${response.statusText}) for ${apiUrl}`);
    }

    const json = (await response.json()) as { data: OutlineDocument };
    return json.data;
  }

  async download(url: string) {
    const response = await fetch(url, { headers: { Authorization: this.authHeader } });
    if (!response.ok) {
      throw new Error(`Failed to download ${url} (${response.status} ${response.statusText})`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType) {
      throw new Error(`Missing Content-Type for ${url}`);
    }

    return { buffer: Buffer.from(await response.arrayBuffer()), contentType };
  }

  // https://outline.immich.cloud/api/attachments.redirect?id=1315cf2a-... -> 1315cf2a-...
  getAttachmentId(url: string): string {
    try {
      return new URL(url, 'http://outline.invalid').searchParams.get('id') ?? url;
    } catch {
      return url;
    }
  }
}
