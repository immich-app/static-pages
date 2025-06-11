import { IsEmail, IsIn, IsString } from 'class-validator';
import { Dataset, ExifDatasetMetadata } from '../../types/metadata';

export class ExifDatasetMetadataValidator extends ExifDatasetMetadata {
	@IsString()
	cameraMake!: string;

	@IsString()
	cameraModel!: string;

	@IsIn(['single', 'burst', 'portrait', 'panorama', 'spherical', 'other'])
	captureType!: 'single' | 'burst' | 'portrait' | 'panorama' | 'spherical' | 'other';

	@IsEmail()
	uploaderEmail!: string;
}

export const DatasetMetadataValidatorMap = {
	[Dataset.Exif]: ExifDatasetMetadataValidator,
};

// Get the correct metadata class type from the map
export type MetadataValidator<D extends Dataset> = InstanceType<(typeof DatasetMetadataValidatorMap)[D]>;
