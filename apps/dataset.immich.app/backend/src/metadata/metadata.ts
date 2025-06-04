import { z } from 'zod';

export const AVAILABLE_DATASETS = ['exif', 'animal'] as const;

const AnimalDatasetMetadataSchema = z.object({
	dataset: z.literal('animal'),
	animalType: z.string(),
	animalBreed: z.string().optional(),
});

const EXIFDatasetMetadataSchema = z.object({
	dataset: z.literal('exif'),
	cameraMfg: z.string().optional(),
	cameraModel: z.string().optional(),
	captureType: z.enum(['single', 'burst', 'portrait']).optional(),
});

export const MetadataSchema = z.discriminatedUnion('dataset', [EXIFDatasetMetadataSchema, AnimalDatasetMetadataSchema]);
