import type { ExifDatasetMetadata, PetDatasetMetadata, Submission } from './metadata';

export interface UploadableAssets {
  assets: {
    data: File;
    name: string;
    metadata: Partial<ExifDatasetMetadata> | Partial<PetDatasetMetadata>;
  }[];
  toSubmission?: (email: string) => Submission;
}
