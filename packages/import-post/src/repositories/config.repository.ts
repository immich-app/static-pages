import { fileURLToPath } from 'node:url';
import { R2Config } from '../types.js';

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

type Config = {
  outlineApiKey: string;
  rootPath: string;
  r2: R2Config;
};

export class ConfigRepository {
  private static instance?: ConfigRepository;

  private config: Config;

  private constructor() {
    this.config = {
      outlineApiKey: required('OUTLINE_API_KEY'),
      rootPath: fileURLToPath(new URL('../../../../', import.meta.url)),
      r2: {
        bucket: required('R2_BUCKET_NAME'),
        endpoint: required('R2_ENDPOINT_URL'),
        accessKeyId: required('R2_ACCESS_KEY_ID'),
        secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
        publicUrl: required('R2_PUBLIC_URL').replace(/\/+$/, ''),
      },
    };
  }

  get() {
    return this.config;
  }

  static create() {
    if (!ConfigRepository.instance) {
      ConfigRepository.instance = new ConfigRepository();
    }

    return ConfigRepository.instance;
  }
}
