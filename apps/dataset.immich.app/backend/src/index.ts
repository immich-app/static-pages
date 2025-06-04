export default {
	async fetch(request, env): Promise<Response> {
		// only listen to /upload requests
		if (!request.url.endsWith('/upload')) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Not Found',
				}),
				{ status: 404 },
			);
		}

		if (request.method != 'PUT') {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Method not allowed',
				}),
				{ status: 405 },
			);
		}

		// extract multipart form data
		const contentType = request.headers.get('content-type');
		if (!contentType || !contentType.startsWith('multipart/form-data')) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Invalid content type, expected multipart/form-data',
				}),
				{ status: 400 },
			);
		}

		const formData = await request.formData();
		const imageUpload = formData.get('file');
		const metadata = formData.get('data');

		if (!imageUpload || !metadata) {
			return new Response(
				JSON.stringify({
					success: false,
					error: "Missing required fields: 'file' or 'data'",
				}),
				{ status: 400 },
			);
		}

		if ((imageUpload as File).size == 0) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'File is empty',
				}),
				{ status: 400 },
			);
		}

		// TODO: do some metadata validation on the file and required fields in jsonData

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
