export type DocumentKind = 'text' | 'file';

export const UPLOAD_MAX_SIZE = 26_214_400; // 25Mb

export const SUPPORTED_FILE_EXTENSIONS: Record<string, string> = {
  'image/gif': 'gif',
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/jpe': 'jpe',
  'application/pdf': 'pdf'
};

export const SUPPORTED_MIMETYPES = Object.keys(SUPPORTED_FILE_EXTENSIONS);

// Uploads are checked by comparing the mimetype the client declared against the one
// detected from the file content. image/jpg and image/jpe are aliases browsers still
// send for image/jpeg, and detection only ever reports the canonical type, so both
// sides go through canonicalMimeType() before being compared.
export const CANONICAL_MIMETYPES: Record<string, string> = {
  'image/gif': 'image/gif',
  'image/png': 'image/png',
  'image/jpeg': 'image/jpeg',
  'image/jpg': 'image/jpeg',
  'image/jpe': 'image/jpeg',
  'application/pdf': 'application/pdf'
};

export function canonicalMimeType(mimeType?: string): string | undefined {
  const type = mimeType?.split(';')[0]?.trim();
  return type ? CANONICAL_MIMETYPES[type] : undefined;
}

export interface DocumentType<
  Realm = string,
  Template = string,
  Tenant = string,
  Lease = string
> {
  _id: string;
  realmId: Realm;
  relatesTo?: {
    template?: Template;
    tenants?: Tenant[];
    leases?: Lease[];
  };
  type: DocumentKind;
  name: string;
  description?: string;
  mimeType?: string;
  expiryDate?: string;
  contents?: Record<string, unknown>;
  html?: string;
  url?: string;
  folder?: string;
  createdDate?: string;
  updatedDate?: string;
  deletedAt?: string;
}
