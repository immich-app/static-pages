import { AutoRouter, IRequest } from 'itty-router';
import { Dataset, type Submission } from '../../../types/metadata';
import { withJWTAuth } from '../auth';
import { MAX_FILE_SIZE } from '../constants';
import { handleError, uploadAssetWithMetadata, validateAssetWithMetadata } from '../utils';

export const petsRouter = AutoRouter<IRequest, [Env, ExecutionContext]>({ base: '/api/pets' });

petsRouter.put('/upload', withJWTAuth, async (req, env) => {
  try {
    const { file, metadata } = await validateAssetWithMetadata(req, Dataset.Pets);
    if (file.size > MAX_FILE_SIZE) {
      return handleError(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`, 413);
    }

    const uploadId = req.extras?.authID;
    await uploadAssetWithMetadata(env, uploadId, file, metadata, Dataset.Pets, false);

    return Response.json(
      {
        success: true,
        uploadID: metadata.assetId,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error instanceof Error ? error.message : 'Unknown error occurred');
  }
});

petsRouter.put('/submit', withJWTAuth, async (req, env) => {
  const submission = (await req.json()) as Submission;
  const uploadId = req.extras?.authID;
  await env.IMAGE_UPLOADS.put(`datasets/${Dataset.Pets}/${uploadId}/submission.json`, JSON.stringify(submission));
  return Response.json({ success: true }, { status: 201 });
});
