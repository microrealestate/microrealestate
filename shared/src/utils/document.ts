import { CANONICAL_MIMETYPES } from '../entities/document';

export function canonicalMimeType(mimeType?: string): string | undefined {
  const type = mimeType?.split(';')[0]?.trim();
  return type ? CANONICAL_MIMETYPES[type] : undefined;
}
