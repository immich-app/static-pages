export enum Dataset {
  Exif = 'exif',
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

type DatasetMetadataMap = {
  [Dataset.Exif]: typeof ExifDatasetMetadata;
};

export type MetadataType<D extends Dataset> = InstanceType<DatasetMetadataMap[D]>;
