export interface EmailType {
  _id: string;
  templateName: string;
  recordId: string;
  params?: Record<string, unknown>;
  sentTo: string;
  /** Sortable date string YYYY-MM-DDTHH:mm. */
  sentDate?: string;
}
