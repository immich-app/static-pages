import { AutoRouter, IRequest } from 'itty-router';
import { Dataset } from '../../../types/metadata';
import { withJWTAuth } from '../auth';
import { MAX_FILE_SIZE } from '../constants';
import { handleError, uploadAssetWithMetadata, validateAssetWithMetadata } from '../utils';

export const exifRouter = AutoRouter<IRequest, [Env, ExecutionContext]>({ base: '/api/exif' });

exifRouter.put('/upload', withJWTAuth, async (req, env) => {
  try {
    const { file, metadata } = await validateAssetWithMetadata(req, Dataset.Exif);
    if (file.size > MAX_FILE_SIZE) {
      return handleError(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`, 413);
    }

    await uploadAssetWithMetadata(env, file, metadata, Dataset.Exif);

    // 50% chance of success for demonstration purposes
    const isSuccess = Math.random() > 0.5;
    if (!isSuccess) {
      throw new Error('Simulated upload failure for demonstration purposes');
    }

    return new Response(
      JSON.stringify({
        success: true,
        uploadID: metadata.assetId,
      }),
      { status: 201 },
    );
  } catch (error) {
    return handleError(error instanceof Error ? error.message : 'Unknown error occurred');
  }
});
