import { IsIn, IsOptional, IsString } from 'class-validator';

export class EXIFDatasetMetadataDto {
	@IsIn(['exif'])
	dataset!: 'exif';

	@IsOptional()
	@IsString()
	cameraMfg!: string;

	@IsOptional()
	@IsString()
	cameraModel!: string;

	@IsOptional()
	@IsIn(['single', 'burst', 'portrait'])
	captureType!: 'single' | 'burst' | 'portrait';
}
