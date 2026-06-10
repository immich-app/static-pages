import { IsEmail, IsIn, IsString, IsUUID } from 'class-validator';
import { AuthRequest } from '../../types/auth';
import { Dataset, ExifDatasetMetadata, PetDatasetMetadata } from '../../types/metadata';

export class ExifDatasetMetadataValidator extends ExifDatasetMetadata {
  @IsString()
  originalFilename!: string;

  @IsUUID()
  assetId!: string;

  @IsString()
  cameraMake!: string;

  @IsString()
  cameraModel!: string;

  @IsIn(['single', 'burst', 'portrait', 'panorama', 'spherical', 'other'])
  captureType!: 'single' | 'burst' | 'portrait' | 'panorama' | 'spherical' | 'other';

  @IsEmail()
  uploaderEmail!: string;
}

export class PetDatasetMetadataValidator extends PetDatasetMetadata {
  @IsString()
  originalFilename!: string;

  @IsUUID()
  assetId!: string;

  @IsIn(['Cat', 'Other', 'Chinchilla', 'Dog', 'Ferret', 'GuineaPig', 'Hamster', 'Hedgehog', 'Bird', 'Pig', 'Rabbit'])
  animal!:
    | 'Cat'
    | 'Other'
    | 'Chinchilla'
    | 'Dog'
    | 'Ferret'
    | 'GuineaPig'
    | 'Hamster'
    | 'Hedgehog'
    | 'Bird'
    | 'Pig'
    | 'Rabbit';

  @IsString()
  breed!: string;

  @IsIn(['Young', 'Adult', 'Senior'])
  age!: 'Young' | 'Adult' | 'Senior';

  @IsString()
  name!: string;

  @IsEmail()
  uploaderEmail!: string;
}

export const DatasetMetadataValidatorMap = {
  [Dataset.Exif]: ExifDatasetMetadataValidator,
  [Dataset.Pets]: PetDatasetMetadataValidator,
};

// Get the correct metadata class type from the map
export type MetadataValidator<D extends Dataset> = InstanceType<(typeof DatasetMetadataValidatorMap)[D]>;

export class AuthRequestValidator extends AuthRequest {
  @IsString()
  turnstileToken!: string;
}
