import type { Image, Link, Parent } from 'mdast';
import { join } from 'node:path';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { Document, isSeq, parse, Scalar, visit as visitYaml } from 'yaml';
import { ATTACHMENT_PREFIX, DATE_ONLY, PIPELINE_VERSION } from '../constants.js';
import type { ConfigRepository } from '../repositories/config.repository.js';
import type { MediaRepository } from '../repositories/media.repository.js';
import type { OutlineRepository } from '../repositories/outline.repository.js';
import type { R2Repository } from '../repositories/r2.repository.js';
import type { SystemRepository } from '../repositories/system.repository.js';
import type { MarkdownDocument, OutlineAttachment, ParsedDocument } from '../types.js';

const cleanTitle = (title: string | null | undefined): string | undefined =>
  title && !title.startsWith(' =') ? title : undefined;

// The markup lands in a Svelte template, where a bare brace would open an expression.
const ATTRIBUTE_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '"': '&quot;',
  '<': '&lt;',
  '>': '&gt;',
  '{': '&lbrace;',
  '}': '&rbrace;',
};

const attributes = (values: Record<string, string | number | undefined>): string =>
  Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .map(
      ([key, value]) =>
        ` ${key}="${String(value).replaceAll(/[&"<>{}]/g, (character) => ATTRIBUTE_ESCAPES[character])}"`,
    )
    .join('');

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/[-\s]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');

const parseYml = (text: string): ParsedDocument => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!match) {
    return { data: {}, content: text };
  }
  const data = (parse(match[1]) as Record<string, unknown> | null) ?? {};
  return { data, content: match[2] };
};

const serializeYml = (data: Record<string, unknown>, content: string): string => {
  const doc = new Document(data, { sortMapEntries: true });

  // Keep `authors: [Immich Team]` on a single flow-style line.
  const authors = doc.get('authors', true);
  if (isSeq(authors)) {
    authors.flow = true;
  }

  // Emit date-only values unquoted (e.g. `publishedAt: 2026-03-02`).
  visitYaml(doc, {
    Scalar(_, node) {
      if (typeof node.value === 'string' && DATE_ONLY.test(node.value)) {
        node.type = Scalar.PLAIN;
      }
    },
  });

  const body = content.replace(/^\s+/, '').replace(/\s+$/, '');
  return `---\n${doc.toString()}---\n\n${body}\n`;
};

const markdown = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkStringify, { bullet: '-', emphasis: '_', strong: '*', rule: '-' });

export class ImportService {
  constructor(
    private readonly configRepository: ConfigRepository,
    private readonly outlineRepository: OutlineRepository,
    private readonly systemRepository: SystemRepository,
    private readonly mediaRepository: MediaRepository,
    private readonly r2Repository: R2Repository,
  ) {}

  async run(postUrl: string): Promise<void> {
    const { rootPath: repoRoot, r2 } = this.configRepository.get();

    const post = await this.outlineRepository.getDocument(postUrl);
    const { data, content } = parseYml(post.text);
    const uuid = post.id;
    const title = data.title || post.title;
    const postType = data.type || 'post';
    const slug = data.slug || slugify(title);
    const folder = `(${postType}s)/${slug}`;
    const bucketFolder = `blog/${uuid}`;
    const outputRelative = `src/routes/(shell)/blog/${folder}/+page.md`;

    console.log(`Importing:
  ID:    ${uuid}
  Title: ${title}
  Path:  ${outputRelative}
  Bucket:  ${bucketFolder}
`);

    if (!(await this.systemRepository.confirm())) {
      return;
    }

    const existing = await this.r2Repository.listObjects(bucketFolder);
    const existingKeys = new Set(existing.map(({ key }) => key));
    const referencedKeys = new Set<string>();

    const upload = async (filename: string, body: Buffer, contentType: string): Promise<string> => {
      const key = `${bucketFolder}/${filename}`;
      if (!existingKeys.has(key) && !referencedKeys.has(key)) {
        await this.r2Repository.upload(key, body, contentType);
        console.log(`Uploaded: ${key}`);
      }
      referencedKeys.add(key);
      return `${r2.publicUrl}/${key}`;
    };

    const document = markdown.parse(content);
    const firstAsCover = postType !== 'release';

    let cover: Record<string, unknown> | undefined;
    for (const attachment of this.getAttachments(document)) {
      const url = new URL(attachment.url, postUrl).href;
      const { buffer, contentType: originalContentType } = await this.outlineRepository.download(url);
      const attachmentId = this.outlineRepository.getAttachmentId(url);

      if (attachment.type === 'video' && originalContentType !== 'video/mp4') {
        console.warn(`Warning: Expected video/mp4 but got ${originalContentType} for ${attachmentId}`);
        continue;
      }

      console.log(`Processing attachment: ${attachmentId} (${originalContentType})`);

      if (attachment.type === 'video') {
        const { buffer: body, extension, contentType } = await this.mediaRepository.optimizeVideo(buffer);
        const src = await upload(`${this.systemRepository.md5(body)}.${extension}`, body, contentType);
        const markup = `<video autoplay${attributes({ src, title: cleanTitle(attachment.title) })} controls>Your browser does not support the video tag.</video>`;
        attachment.update(markup);
        continue;
      }

      const variants = await this.mediaRepository.optimizeImage(buffer);
      const widest = variants.at(-1)!;
      // An image has no single output to hash, and libaom is not byte-stable across thread counts.
      const hash = this.systemRepository.md5(Buffer.concat([Buffer.from(PIPELINE_VERSION), buffer]));

      const candidates: { url: string; width: number }[] = [];
      for (const { buffer: body, width, extension } of variants) {
        const url = await upload(`${hash}-${width}.${extension}`, body, `image/${extension}`);
        candidates.push({ url, width });
      }

      const image = {
        src: candidates.at(-1)!.url,
        // A lone candidate would still take its intrinsic width from `sizes` and upscale.
        srcset: candidates.length > 1 ? candidates.map(({ url, width }) => `${url} ${width}w`).join(', ') : undefined,
        width: widest.width,
        height: widest.height,
      };

      if (firstAsCover && !cover) {
        cover = {
          coverUrl: image.src,
          coverSrcset: image.srcset,
          coverWidth: image.width,
          coverHeight: image.height,
          coverAlt: attachment.alt,
        };
        attachment.remove();
      } else {
        attachment.update(
          `<Markdown.Image${attributes({ ...image, alt: attachment.alt, title: cleanTitle(attachment.title) })} />`,
        );
      }
    }

    // remark escapes `<` in text as `\<`; keep it bare to match the source
    const rendered = markdown.stringify(document).replaceAll(String.raw`\<`, '<');

    const metadata: Record<string, unknown> = { ...data, id: uuid, title, slug, authors: ['Immich Team'], ...cover };
    if (metadata.publishedAt instanceof Date) {
      metadata.publishedAt = metadata.publishedAt.toISOString().slice(0, 10);
    }

    if (!metadata.publishedAt) {
      metadata.publishedAt = new Date().toISOString().slice(0, 10);
    }

    // Nothing is deleted: the deployed markdown points at the old keys until this import ships.
    const uploadedKeys = referencedKeys.difference(existingKeys);
    console.log(`\nBucket stats (uploaded=${uploadedKeys.size}, unchanged=${referencedKeys.size - uploadedKeys.size})`);

    const outputFile = join(repoRoot, 'apps/root.immich.app', outputRelative);
    this.systemRepository.write(outputFile, serializeYml(metadata, rendered));
    this.systemRepository.format(repoRoot, outputFile);

    console.log(`\nhttp://localhost:5173/blog/${slug}`);

    if (process.env.GITHUB_OUTPUT) {
      this.systemRepository.append(process.env.GITHUB_OUTPUT, `slug=${slug}\nuuid=${uuid}\n`);
    }
  }

  getAttachments(document: MarkdownDocument): OutlineAttachment[] {
    const attachments: OutlineAttachment[] = [];

    visit(document, 'image', (node, index, parent) => {
      if (!parent || typeof index !== 'number') {
        return;
      }

      attachments.push({
        url: node.url,
        type: 'image',
        alt: node.alt ?? '',
        title: node.title,
        update: (markup) => this.replaceNode(parent, node, markup),
        remove: () => this.removeNode(document, parent, node),
      });
    });

    visit(document, 'link', (node, index, parent) => {
      if (!parent || typeof index !== 'number' || !node.url.startsWith(ATTACHMENT_PREFIX)) {
        return;
      }

      attachments.push({
        url: node.url,
        type: 'video',
        alt: '',
        title: node.title,
        update: (markup) => this.replaceNode(parent, node, markup),
        remove: () => this.removeNode(document, parent, node),
      });
    });

    return attachments;
  }

  private replaceNode(parent: Parent, node: Image | Link, markup: string): void {
    parent.children[parent.children.indexOf(node)] = { type: 'html', value: markup };
  }

  private removeNode(document: MarkdownDocument, parent: Parent, node: Image | Link): void {
    const index = parent.children.indexOf(node);
    if (index !== -1) {
      parent.children.splice(index, 1);
    }
    // Drop the wrapping paragraph if removing the node left it empty.
    if (parent.type === 'paragraph' && parent.children.length === 0) {
      visit(document, 'paragraph', (candidate, candidateIndex, candidateParent) => {
        if (!(candidate === parent && candidateParent && typeof candidateIndex === 'number')) {
          return;
        }

        candidateParent.children.splice(candidateIndex, 1);
        return false;
      });
    }
  }
}
