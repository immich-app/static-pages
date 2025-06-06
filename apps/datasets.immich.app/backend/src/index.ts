import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { AutoRouter, IRequest } from 'itty-router';
import { EXIFDatasetMetadataDto } from './metadata';

function handleError(message: string, returnCode: number = 400): Response {
	return new Response(
		JSON.stringify({
			success: false,
			error: message,
		}),
		{ status: returnCode },
	);
}

const router = AutoRouter<IRequest, [Env, ExecutionContext]>();

router.put('/upload', async (req, env) => {
	let content: FormData;
	try {
		content = await req.formData();
	} catch {
		return handleError('Failed to parse form data, please ensure the request is properly formatted');
	}

	const imageUpload = content.get('file');
	const formMetadata = content.get('data');

	if (!imageUpload || !formMetadata) {
		return handleError("Missing required fields: 'file' or 'data'");
	}

	if ((imageUpload as File).size == 0) {
		return handleError('Image file is empty, please upload a valid image');
	}

	// type check metadata with zod
	const metadata = plainToClass(EXIFDatasetMetadataDto, JSON.parse(formMetadata as string));
	const validationErrors = await validate(metadata);
	if (validationErrors.length > 0) {
		return handleError(`Invalid metadata format, please ensure it matches the required schema: ${JSON.stringify(validationErrors)}`);
	}

	const fileExtension = (imageUpload as File).name.split('.').pop()?.toLowerCase();
	const uploadID = crypto.randomUUID();
	const metadataName = `info-${uploadID}.json`;

	// only tack on the file extension if it exists
	// we will have to infer extension during processing if not provided
	const imageName = `image-${uploadID}${fileExtension ? `.${fileExtension}` : ''}`;

	// upload image to R2
	await env.IMAGE_UPLOADS.put(imageName, imageUpload);

	// upload json payload to R2
	await env.IMAGE_UPLOADS.put(metadataName, JSON.stringify(metadata));

	return new Response(
		JSON.stringify({
			success: true,
			uploadID: uploadID,
		}),
		{ status: 201 },
	);
});

export default router;
