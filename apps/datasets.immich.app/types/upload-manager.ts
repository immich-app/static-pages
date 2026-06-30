import { ExifDatasetMetadata, PetDatasetMetadata } from './metadata';

export interface UploadableAssets {
  assets: {
    data: File;
    name: string;
    metadata: Partial<ExifDatasetMetadata> | Partial<PetDatasetMetadata>;
  }[];
}
