import { plainToClass } from 'class-transformer';
import { DatasetMetadataValidatorMap } from './validators';
import { validate } from 'class-validator';
import { Dataset, MetadataType } from '../../types/metadata';

export function handleError(message: string, returnCode: number = 400): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
    }),
    { status: returnCode },
  );
}

export async function uploadAssetWithMetadata<D extends Dataset>(
  env: Env,
  uploadID: string,
  assetFile: File,
  metadata: MetadataType<D>,
  dataset: D,
) {
  const fileExtension = assetFile.name.split('.').pop()?.toLowerCase();
  const metadataName = `info-${uploadID}.json`;

  // only tack on the file extension if it exists
  // we will have to infer extension during processing if not provided
  const imageName = `image-${uploadID}${fileExtension ? `.${fileExtension}` : ''}`;

  // upload image to R2
  await env.IMAGE_UPLOADS.put(`datasets/${dataset}/${imageName}`, assetFile);

  // upload json payload to R2
  await env.IMAGE_UPLOADS.put(`datasets/${dataset}/${metadataName}`, JSON.stringify(metadata));
}

export async function validateAssetWithMetadata<D extends Dataset>(
  req: Request,
  dataset: D,
): Promise<{ file: File; metadata: MetadataType<D> }> {
  let content: FormData;
  try {
    content = await req.formData();
  } catch {
    throw new Error('Failed to parse form data, please ensure the request is properly formatted');
  }

  const imageUpload = content.get('file');
  const formMetadata = content.get('data');

  if (!imageUpload || !formMetadata) {
    throw new Error("Missing required fields: 'file' or 'data'");
  }

  if ((imageUpload as File).size == 0) {
    throw new Error('Image file is empty, please upload a valid image');
  }

  if (!(imageUpload as File).name) {
    throw new Error('Upload filename is missing');
  }

  // type check metadata before upload
  const metadataValidatorClass = DatasetMetadataValidatorMap[dataset];
  const metadata = plainToClass(metadataValidatorClass, JSON.parse(formMetadata as string));
  const validationErrors = await validate(metadata, { whitelist: true, forbidNonWhitelisted: true });
  if (validationErrors.length > 0) {
    throw new Error(
      `Invalid metadata format, please ensure it matches the required schema: ${JSON.stringify(validationErrors)}`,
    );
  }

  return {
    file: imageUpload as File,
    metadata: metadata as MetadataType<D>,
  };
}
