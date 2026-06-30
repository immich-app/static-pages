import { IsArray, IsEmail, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { AuthRequest } from '../../types/auth';
import { Dataset, ExifDatasetMetadata, PetBox, PetDatasetMetadata } from '../../types/metadata';

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

export class PetBoxValidator extends PetBox {
  @IsNumber()
  left!: number;

  @IsNumber()
  top!: number;

  @IsNumber()
  width!: number;

  @IsNumber()
  height!: number;

  @IsString()
  name!: string;

  @IsString()
  animal!: string;

  @IsString()
  breed!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  birthMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  birthYear?: number;
}

export class PetDatasetMetadataValidator extends PetDatasetMetadata {
  @IsString()
  originalFilename!: string;

  @IsUUID()
  assetId!: string;

  @IsString()
  animal!: string;

  @IsString()
  breed!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  birthMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  birthYear?: number;

  @IsString()
  name!: string;

  @IsArray()
  boxes!: PetBox[];

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
