import type { ReactNode } from 'react';

type ResourceTitleProps = {
  icon?: ReactNode;
  title: string;
  badge?: ReactNode;
  dataCy: string;
};

export default function ResourceTitle({
  icon,
  title,
  badge,
  dataCy
}: ResourceTitleProps) {
  return (
    <h1
      className="flex min-w-0 items-center gap-2 text-base font-semibold leading-tight"
      data-cy={dataCy}
    >
      {icon ? <span className="flex shrink-0 items-center">{icon}</span> : null}
      <span className="min-w-0 truncate">{title}</span>
      {badge ? (
        <span className="flex shrink-0 items-center">{badge}</span>
      ) : null}
    </h1>
  );
}
