export enum Dataset {
  Exif = 'exif',
  Pets = 'pets',
}

class BaseMetadata {
  uploaderEmail!: string;
  originalFilename!: string;
  assetId!: string;
}

export class ExifDatasetMetadata extends BaseMetadata {
  cameraMake!: string;
  cameraModel!: string;
  captureType!: 'single' | 'burst' | 'portrait' | 'panorama' | 'spherical' | 'other';
}

export class PetDatasetMetadata extends BaseMetadata {}

export type User = { id: string; email: string };

export type Pet = {
  id: string;
  name: string;
  animal: string;
  breed: string;
  birthMonth: string;
  birthYear: string;
};

export type Asset = { id: string; originalFileName: string };

export type PetBox = {
  petId: string;
  assetId: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

export type Submission = {
  user: User;
  pets: Pet[];
  assets: Asset[];
  boxes: PetBox[];
};

type DatasetMetadataMap = {
  [Dataset.Exif]: typeof ExifDatasetMetadata;
  [Dataset.Pets]: typeof PetDatasetMetadata;
};

export type MetadataType<D extends Dataset> = InstanceType<DatasetMetadataMap[D]>;
