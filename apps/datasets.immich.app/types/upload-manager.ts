import { ExifDatasetMetadata } from './metadata';

export interface UploadableAssets {
  assets: {
    data: File;
    name: string;
    metadata: Partial<ExifDatasetMetadata>;
  }[];
}
