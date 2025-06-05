import { MetadataSchema } from './metadata';

function handleError(message: string, returnCode: number = 400): Response {
	return new Response(
		JSON.stringify({
			success: false,
			error: message,
		}),
		{ status: returnCode },
	);
}

export default {
	async fetch(request, env): Promise<Response> {
		// only listen to /upload requests
		if (!request.url.endsWith('/upload')) {
			return handleError('404 not found', 404);
		}

		if (request.method != 'PUT') {
			return handleError(`${request.method}: Method not allowed`, 405);
		}

		// extract multipart form data
		const contentType = request.headers.get('content-type');
		if (!contentType || !contentType.startsWith('multipart/form-data')) {
			return handleError("Invalid content type, expected 'multipart/form-data'");
		}

		const formData = await request.formData();
		const imageUpload = formData.get('file');
		const formMetadata = formData.get('data');

		if (!imageUpload || !formMetadata) {
			return handleError("Missing required fields: 'file' or 'data'");
		}

		if ((imageUpload as File).size == 0) {
			return handleError('Image file is empty, please upload a valid image');
		}

		// type check metadata with zod
		const metadata = JSON.parse(formMetadata as string);
		const metadataValidation = MetadataSchema.safeParse(metadata);
		if (!metadataValidation.success) {
			return handleError(`Invalid metadata format, please ensure it matches the required schema: ${metadataValidation.error.message}`);
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
	},
} satisfies ExportedHandler<Env>;
