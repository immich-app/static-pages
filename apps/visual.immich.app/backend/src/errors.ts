import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class ClientError extends Error {
  constructor(
    message: string,
    readonly status: ContentfulStatusCode,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }

  getResponse(): Record<string, unknown> {
    return { message: this.message };
  }
}

export class BadRequestError extends ClientError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 400, options);
  }
}

export class ValidationError extends BadRequestError {
  constructor(readonly errors: readonly unknown[]) {
    super('Validation failed');
  }

  override getResponse() {
    return { message: this.message, errors: this.errors };
  }
}

export class UnauthorizedError extends ClientError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

export class ForbiddenError extends ClientError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}
