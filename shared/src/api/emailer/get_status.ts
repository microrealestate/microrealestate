import type { EmailName } from '../../entities/email';

export type RequestParams = {
  startTerm: string;
  endTerm?: string;
};

export type RequestBody = Record<string, never>;

export type ResponseBody = Array<{
  templateName: EmailName;
  recordId: string;
  /** Only the rent documents carry a term, so this is optional. */
  params?: { term?: number };
  sentTo: string[];
  /** Sortable date string YYYY-MM-DDTHH:mm. */
  sentDate?: string;
}>;
