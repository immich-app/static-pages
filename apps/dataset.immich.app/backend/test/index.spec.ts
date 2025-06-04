import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

describe('Dataset upload API worker', () => {
	it('responds with a successful upload', async () => {
		const formData = new FormData();
		formData.append('file', new Blob(['test1234'], { type: 'image/jpeg' }), 'test.jpg');
		formData.append(
			'data',
			JSON.stringify({
				title: 'Test Image',
				description: 'This is a test image.',
			}),
		);

		const response = await SELF.fetch(
			new Request('https://example.com/upload', {
				method: 'PUT',
				body: formData,
			}),
		);

		expect(response.status).toBe(201);
	});

	it('handles files with missing extension', async () => {
		const formData = new FormData();
		formData.append('file', new Blob(['test1234'], { type: 'image/jpeg' }));
		formData.append(
			'data',
			JSON.stringify({
				title: 'Test Image',
				description: 'This is a test image.',
			}),
		);

		const response = await SELF.fetch(
			new Request('https://example.com/upload', {
				method: 'PUT',
				body: formData,
			}),
		);

		expect(response.status).toBe(201);
	});

	it('rejects a missing file', async () => {
		const formData = new FormData();
		formData.append(
			'data',
			JSON.stringify({
				title: 'Test Image',
				description: 'This is a test image.',
			}),
		);

		const response = await SELF.fetch(
			new Request('https://example.com/upload', {
				method: 'PUT',
				body: formData,
			}),
		);

		expect(response.status).toBe(400);
	});

	it('rejects an empty file', async () => {
		const formData = new FormData();
		formData.append('file', new Blob([], { type: 'image/jpeg' }), 'test.jpg');

		formData.append(
			'data',
			JSON.stringify({
				title: 'Test Image',
				description: 'This is a test image.',
			}),
		);

		const response = await SELF.fetch(
			new Request('https://example.com/upload', {
				method: 'PUT',
				body: formData,
			}),
		);

		expect(response.status).toBe(400);
	});

	it('rejects missing metadata', async () => {
		const formData = new FormData();
		formData.append('file', new Blob(['test1234'], { type: 'image/jpeg' }), 'test.jpg');

		const response = await SELF.fetch(
			new Request('https://example.com/upload', {
				method: 'PUT',
				body: formData,
			}),
		);

		expect(response.status).toBe(400);
	});

	it('rejects missing all data', async () => {
		const formData = new FormData();

		const response = await SELF.fetch(
			new Request('https://example.com/upload', {
				method: 'PUT',
				body: formData,
			}),
		);

		expect(response.status).toBe(400);
	});

	it('rejects non-put request', async () => {
		const formData = new FormData();
		formData.append('file', new Blob(['test1234'], { type: 'image/jpeg' }), 'test.jpg');
		formData.append(
			'data',
			JSON.stringify({
				title: 'Test Image',
				description: 'This is a test image.',
			}),
		);

		const response = await SELF.fetch(
			new Request('https://example.com/upload', {
				method: 'POST',
				body: formData,
			}),
		);

		expect(response.status).toBe(405);
	});
});
