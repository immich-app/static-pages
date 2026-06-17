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
  birthMonth!: number;
  birthYear!: number;
  animal!: string;
  breed!: string;
}

export class ExifDatasetMetadata extends BaseMetadata {
  cameraMake!: string;
  cameraModel!: string;
  captureType!: 'single' | 'burst' | 'portrait' | 'panorama' | 'spherical' | 'other';
}
export class PetDatasetMetadata extends BaseMetadata {
  animal!:
    | 'Cat'
    | 'Chinchilla'
    | 'Dog'
    | 'Ferret'
    | 'GuineaPig'
    | 'Hamster'
    | 'Hedgehog'
    | 'Bird'
    | 'Pig'
    | 'Rabbit'
    | 'Other';

  breed!: string;
  birthMonth!: number;
  birthYear!: number;
  name!: string;
}
type DatasetMetadataMap = {
  [Dataset.Exif]: typeof ExifDatasetMetadata;
  [Dataset.Pets]: typeof PetDatasetMetadata;
};

export type MetadataType<D extends Dataset> = InstanceType<DatasetMetadataMap[D]>;
