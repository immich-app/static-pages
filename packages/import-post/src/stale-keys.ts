import { CLEANUP_GRACE_DAYS } from './constants.js';
import type { BucketObject } from './types.js';

export const staleKeys = (posts: string, publicUrl: string, objects: BucketObject[]): string[] => {
  const reference = new RegExp(String.raw`${RegExp.escape(publicUrl)}/(blog/[\w./-]+)`, 'g');
  const referenced = new Set(posts.matchAll(reference).map((match) => match[1]));
  const cutoff = Date.now() - CLEANUP_GRACE_DAYS * 24 * 60 * 60 * 1000;
  return objects
    .filter(({ key, lastModified }) => !referenced.has(key) && lastModified.getTime() < cutoff)
    .map(({ key }) => key);
};
