export type TemplateKind = 'text' | 'fileDescriptor';

export interface TemplateType<Realm = string, Lease = string> {
  _id: string;
  realmId?: Realm;
  name: string;
  type?: TemplateKind;
  description?: string;
  hasExpiryDate: boolean;
  contents?: Record<string, unknown>;
  html?: string;
  relatesTo: Lease[];
  required: boolean;
  requiredOnceContractTerminated: boolean;
}
