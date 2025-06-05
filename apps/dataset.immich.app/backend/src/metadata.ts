import { z } from 'zod';

const EXIFDatasetMetadataSchema = z.object({
	dataset: z.literal('exif'),
	cameraMfg: z.string().optional(),
	cameraModel: z.string().optional(),
	captureType: z.enum(['single', 'burst', 'portrait']).optional(),
});

export const MetadataSchema = z.discriminatedUnion('dataset', [EXIFDatasetMetadataSchema]);
