import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

async function getJWTAuthHeader() {
  const response = await SELF.fetch(
    new Request('https://example.com/api/auth', {
      method: 'POST',
      body: JSON.stringify({ turnstileToken: 'TEST_TOKEN' }),
    }),
  );

  const data = (await response.json()) as { token: string };
  return `Bearer ${data.token}`;
}

describe('JWT Authentication', () => {
  it('returns a valid JWT token', async () => {
    const response = await SELF.fetch(
      new Request('https://example.com/api/auth', {
        method: 'POST',
        body: JSON.stringify({ turnstileToken: 'TEST_TOKEN' }),
      }),
    );

    const data = (await response.json()) as { token: string };

    expect(response.status).toBe(200);
    expect(data.token).toBeDefined();
    expect(data.token).toMatch(/^[A-Za-z0-9-_.]+$/);
  });
});

describe('EXIF Dataset upload API worker', () => {
  it('responds with a successful upload', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test1234'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append(
      'data',
      JSON.stringify({
        cameraMake: 'canon',
        cameraModel: 'eos 5D Mark IV',
        captureType: 'single',
        uploaderEmail: 'test@example.com',
        originalFilename: 'test.jpg',
        assetId: crypto.randomUUID(),
      }),
    );

    const response = await SELF.fetch(
      new Request('https://example.com/api/exif/upload', {
        method: 'PUT',
        body: formData,
        headers: {
          Authorization: await getJWTAuthHeader(),
        },
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
        cameraMake: 'canon',
        cameraModel: 'eos 5D Mark IV',
        captureType: 'single',
        uploaderEmail: 'test@example.com',
        originalFilename: 'test.jpg',
        assetId: crypto.randomUUID(),
      }),
    );

    const response = await SELF.fetch(
      new Request('https://example.com/api/exif/upload', {
        method: 'PUT',
        body: formData,
        headers: {
          Authorization: await getJWTAuthHeader(),
        },
      }),
    );

    expect(response.status).toBe(201);
  });

  it('rejects a missing file', async () => {
    const formData = new FormData();
    formData.append(
      'data',
      JSON.stringify({
        cameraMake: 'canon',
        cameraModel: 'eos 5D Mark IV',
        captureType: 'single',
        uploaderEmail: 'test@example.com',
        originalFilename: 'test.jpg',
        assetId: crypto.randomUUID(),
      }),
    );

    const response = await SELF.fetch(
      new Request('https://example.com/api/exif/upload', {
        method: 'PUT',
        body: formData,
        headers: {
          Authorization: await getJWTAuthHeader(),
        },
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
        cameraMake: 'canon',
        cameraModel: 'eos 5D Mark IV',
        captureType: 'single',
        uploaderEmail: 'test@example.com',
        originalFilename: 'test.jpg',
        assetId: crypto.randomUUID(),
      }),
    );

    const response = await SELF.fetch(
      new Request('https://example.com/api/exif/upload', {
        method: 'PUT',
        body: formData,
        headers: {
          Authorization: await getJWTAuthHeader(),
        },
      }),
    );

    expect(response.status).toBe(400);
  });

  it('rejects missing metadata', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test1234'], { type: 'image/jpeg' }), 'test.jpg');

    const response = await SELF.fetch(
      new Request('https://example.com/api/exif/upload', {
        method: 'PUT',
        body: formData,
        headers: {
          Authorization: await getJWTAuthHeader(),
        },
      }),
    );

    expect(response.status).toBe(400);
  });

  it('rejects missing all data', async () => {
    const formData = new FormData();

    const response = await SELF.fetch(
      new Request('https://example.com/api/exif/upload', {
        method: 'PUT',
        body: formData,
        headers: {
          Authorization: await getJWTAuthHeader(),
        },
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
        cameraMake: 'canon',
        cameraModel: 'eos 5D Mark IV',
        captureType: 'single',
        uploaderEmail: 'test@example.com',
        originalFilename: 'test.jpg',
        assetId: crypto.randomUUID(),
      }),
    );

    const response = await SELF.fetch(
      new Request('https://example.com/api/exif/upload', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: await getJWTAuthHeader(),
        },
      }),
    );

    expect(response.status).toBe(404);
  });

  it('rejects a metadata with invalid schema', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test1234'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append(
      'data',
      JSON.stringify({
        type: 'animal',
        animalBreed: 'labrador',
        uploaderEmail: 'test@example.com',
        originalFilename: 'test.jpg',
        assetId: crypto.randomUUID(),
      }),
    );

    const response = await SELF.fetch(
      new Request('https://example.com/api/exif/upload', {
        method: 'PUT',
        body: formData,
        headers: {
          Authorization: await getJWTAuthHeader(),
        },
      }),
    );

    expect(response.status).toBe(400);
  });

  it('rejects with missing auth', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test1234'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append(
      'data',
      JSON.stringify({
        cameraMake: 'canon',
        cameraModel: 'eos 5D Mark IV',
        captureType: 'single',
        uploaderEmail: 'test@example.com',
        originalFilename: 'test.jpg',
        assetId: crypto.randomUUID(),
      }),
    );

    const response = await SELF.fetch(
      new Request('https://example.com/api/exif/upload', {
        method: 'PUT',
        body: formData,
      }),
    );

    expect(response.status).toBe(401);
  });

  it('rejects missing assetId', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test1234'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append(
      'data',
      JSON.stringify({
        cameraMake: 'canon',
        cameraModel: 'eos 5D Mark IV',
        captureType: 'single',
        uploaderEmail: 'test@example.com',
        originalFilename: 'test.jpg',
      }),
    );

    const response = await SELF.fetch(
      new Request('https://example.com/api/exif/upload', {
        method: 'PUT',
        body: formData,
        headers: {
          Authorization: await getJWTAuthHeader(),
        },
      }),
    );

    expect(response.status).toBe(400);
  });

  it('rejects missing original filename', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test1234'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append(
      'data',
      JSON.stringify({
        cameraMake: 'canon',
        cameraModel: 'eos 5D Mark IV',
        captureType: 'single',
        uploaderEmail: 'test@example.com',
        assetId: crypto.randomUUID(),
      }),
    );

    const response = await SELF.fetch(
      new Request('https://example.com/api/exif/upload', {
        method: 'PUT',
        body: formData,
        headers: {
          Authorization: await getJWTAuthHeader(),
        },
      }),
    );

    expect(response.status).toBe(400);
  });
});
