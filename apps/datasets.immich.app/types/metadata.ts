export enum Dataset {
  Exif = 'exif',
  Pets = 'pets',
}

class BaseMetadata {
  uploaderEmail!: string;
  originalFilename!: string;
  assetId!: string;
}

export class Pet {
  id!: string;
  name!: string;
  birthMonth?: number;
  birthYear?: number;
  animal!: string;
  breed!: string;
}

export class ExifDatasetMetadata extends BaseMetadata {
  cameraMake!: string;
  cameraModel!: string;
  captureType!: 'single' | 'burst' | 'portrait' | 'panorama' | 'spherical' | 'other';
}
export class PetBox {
  left!: number;
  top!: number;
  width!: number;
  height!: number;
  name!: string;
  animal!: string;
  breed!: string;
  birthMonth?: number;
  birthYear?: number;
}

export class PetDatasetMetadata extends BaseMetadata {
  animal!: string;
  breed!: string;
  birthMonth?: number;
  birthYear?: number;
  name!: string;
  boxes!: PetBox[];
}
type DatasetMetadataMap = {
  [Dataset.Exif]: typeof ExifDatasetMetadata;
  [Dataset.Pets]: typeof PetDatasetMetadata;
};

export type MetadataType<D extends Dataset> = InstanceType<DatasetMetadataMap[D]>;
