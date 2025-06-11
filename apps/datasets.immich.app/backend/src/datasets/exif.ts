import { AutoRouter, IRequest } from 'itty-router';
import { handleError, uploadAssetWithMetadata, validateAssetWithMetadata } from '../utils';
import { Dataset } from '../../../types/metadata';

export const exifRouter = AutoRouter<IRequest, [Env, ExecutionContext]>({ base: '/exif' });

// TODO:
// 100MB size limit
// Cloudflare turnstile: https://developers.cloudflare.com/turnstile/tutorials/implicit-vs-explicit-rendering/

exifRouter.put('/upload', async (req, env) => {
	const uploadID = crypto.randomUUID();

	try {
		const { file, metadata } = await validateAssetWithMetadata(req, Dataset.Exif);
		await uploadAssetWithMetadata(env, uploadID, file, metadata, Dataset.Exif);
	} catch (error) {
		return handleError(error instanceof Error ? error.message : 'Unknown error occurred');
	}

	return new Response(
		JSON.stringify({
			success: true,
			uploadID: uploadID,
		}),
		{ status: 201 },
	);
});
