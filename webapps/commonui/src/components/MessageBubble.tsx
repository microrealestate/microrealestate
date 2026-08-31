import Link from 'next/link';
import type { ReactNode } from 'react';
import { LuExternalLink } from 'react-icons/lu';

type MessageBubbleProps = {
  message: string;
  label?: string;
  icon?: ReactNode;
} & (
  | { contactHref: string; contactLabel: string }
  | { contactHref?: undefined; contactLabel?: undefined }
);

export default function MessageBubble({
  message,
  label,
  icon,
  contactHref,
  contactLabel
}: MessageBubbleProps) {
  return (
    <div className="bg-primary/10 dark:bg-primary/20 rounded-2xl rounded-tl-sm px-4 py-3 text-sm">
      {(label || icon) && (
        <div className="flex items-center gap-1 mb-2 font-medium text-muted-foreground">
          {icon && (
            <div className="bg-primary/20 dark:bg-primary/30 p-1 rounded-full">
              {icon}
            </div>
          )}
          {label && <p>{label}</p>}
        </div>
      )}
      <p className="whitespace-pre-wrap">{message}</p>
      {contactHref && (
        <div className="flex justify-end mt-2">
          <Link
            href={contactHref}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary underline underline-offset-2 py-0.5"
          >
            <LuExternalLink className="size-3" aria-hidden />
            {contactLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
