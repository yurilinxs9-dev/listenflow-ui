// Shared validation utilities for edge functions

export interface UploadRequest {
  filename: string;
  bucket: 'audiobooks' | 'audiobook-covers';
  expectedSize?: number;
}

export class ValidationError extends Error {
  public readonly field: string;
  
  constructor(message: string, field: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export function validateUploadRequest(body: unknown): UploadRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be an object', 'body');
  }

  const req = body as Record<string, unknown>;

  // Validate filename
  if (!req.filename || typeof req.filename !== 'string') {
    throw new ValidationError('filename is required and must be a string', 'filename');
  }
  
  if (req.filename.length > 255) {
    throw new ValidationError('filename is too long (max 255 characters)', 'filename');
  }
  
  if (req.filename.length < 1) {
    throw new ValidationError('filename cannot be empty', 'filename');
  }
  
  // Check for path traversal attacks
  if (/\\.\\.|[\\/]/.test(req.filename)) {
    throw new ValidationError('filename contains invalid characters', 'filename');
  }

  // Validate bucket
  if (!req.bucket || typeof req.bucket !== 'string') {
    throw new ValidationError('bucket is required and must be a string', 'bucket');
  }
  
  if (!['audiobooks', 'audiobook-covers'].includes(req.bucket)) {
    throw new ValidationError('invalid bucket name', 'bucket');
  }

  // Validate expectedSize if provided
  if (req.expectedSize !== undefined) {
    if (typeof req.expectedSize !== 'number' || req.expectedSize < 0) {
      throw new ValidationError('expectedSize must be a positive number', 'expectedSize');
    }
    
    const maxSize = req.bucket === 'audiobooks' ? 5_000_000_000 : 500_000_000;
    if (req.expectedSize > maxSize) {
      throw new ValidationError(`expectedSize exceeds maximum for ${req.bucket}`, 'expectedSize');
    }
  }

  return {
    filename: req.filename,
    bucket: req.bucket as 'audiobooks' | 'audiobook-covers',
    expectedSize: req.expectedSize as number | undefined,
  };
}

export async function parseRequestBody<T>(
  req: Request,
  maxSize: number = 10_000 // 10KB default
): Promise<T> {
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > maxSize) {
    throw new ValidationError('Request body too large', 'body');
  }

  const text = await req.text();
  if (text.length > maxSize) {
    throw new ValidationError('Request body too large', 'body');
  }

  try {
    return JSON.parse(text) as T;
  } catch (e) {
    throw new ValidationError('Invalid JSON in request body', 'body');
  }
}
