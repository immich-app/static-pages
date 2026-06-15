import type { Root } from 'mdast';

export type R2Config = {
  bucket: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl: string;
};

export type OutlineDocument = {
  id: string;
  title: string;
  text: string;
};

export type ParsedDocument = {
  data: {
    title?: string;
    description?: string;
    publishedAt?: string;
    type?: string;
    slug?: string;
  };
  content: string;
};

export type OptimizeResult = { buffer: Buffer; extension: string; contentType: string };

export type MarkdownDocument = Root;

export type AttachmentType = 'image' | 'video';

export type OutlineAttachment = {
  url: string;
  type: AttachmentType;
  alt: string;
  title: string | null | undefined;
  update(url: string, title: string | null | undefined): void;
  remove(): void;
};
