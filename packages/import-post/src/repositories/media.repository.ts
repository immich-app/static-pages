import sharp from 'sharp';
import { WEBP_QUALITY } from '../constants.js';
import { OptimizeResult } from '../types.js';

export class MediaRepository {
  async optimizeImage(buffer: Buffer): Promise<OptimizeResult> {
    const output = await sharp(buffer, { animated: true }).webp({ quality: WEBP_QUALITY }).toBuffer();
    return {
      buffer: output,
      extension: 'webp',
      contentType: 'image/webp',
    };
  }

  async optimizeVideo(buffer: Buffer): Promise<OptimizeResult> {
    // todo
    const output = buffer;
    return {
      buffer: output,
      extension: 'mp4',
      contentType: 'video/mp4',
    };
  }
}
