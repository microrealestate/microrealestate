import { cn } from '@microrealestate/commonui/utils';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import {
  SelectCheckbox,
  useIsSelected,
  useMultiSelectionContext
} from '@/components/MultiSelection';
import NumberFormat from '@/components/NumberFormat';
import { Link } from '@/i18n/navigation';
import {
  childUnits,
  displayStatus,
  STATUS_CLASSES,
  type Unit
} from '../composition';
import PropertyIcon from '../PropertyIcon';
import type { RowItem } from '../stackingPlan';
import { EmptyGroup, TICKED, usePropertyHref, useStatusLabel } from './shared';

export function Tile({ unit, units }: { unit: Unit; units: Unit[] }) {
  const t = useTranslations('common');
  const href = usePropertyHref();
  const status = displayStatus(unit);
  const statusLabel = useStatusLabel();
  const included = childUnits(unit._id, units).length;
  const controlId = useId();
  const { selecting, selected } = useMultiSelectionContext();
  const ticked = selected.has(unit._id);
  const className = cn(
    'relative flex h-full min-h-[4.5rem] w-full flex-col gap-1 rounded-lg border p-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    STATUS_CLASSES[status ?? 'occupied'],
    selecting
      ? ticked
        ? TICKED
        : 'hover:bg-primary/10'
      : 'transition-shadow hover:ring-2 hover:ring-primary/40'
  );
  const body = (
    <>
      {selecting ? (
        <span className="absolute right-2 top-2 flex">
          <SelectCheckbox
            id={unit._id}
            name={unit.name}
            controlId={controlId}
          />
        </span>
      ) : null}
      <span
        className={cn(
          'flex min-w-0 items-center gap-2 font-medium',
          selecting && 'pr-6'
        )}
      >
        <PropertyIcon
          type={unit.type}
          className="size-4 shrink-0"
          aria-hidden="true"
        />
        <span className="truncate">{unit.name}</span>
      </span>
      {included ? (
        <span className="pl-6 text-xs text-muted-foreground">
          {t(
            '{count, plural, one {Includes # property} other {Includes # properties}}',
            { count: included }
          )}
        </span>
      ) : null}
      {unit.availableForRent ? (
        <NumberFormat
          value={unit.price}
          withColor={undefined}
          debitColor={undefined}
          creditColor={undefined}
          className="mt-auto pl-6 text-xs tabular-nums text-muted-foreground"
        />
      ) : null}
      <span className="sr-only">{statusLabel(status)}</span>
    </>
  );

  return (
    <li>
      {selecting ? (
        <label
          htmlFor={controlId}
          title={unit.name}
          className={cn(className, 'cursor-pointer')}
        >
          {body}
        </label>
      ) : (
        <Link
          href={href(unit)}
          title={unit.name}
          className={className}
          data-cy="openPropertyLink"
        >
          {body}
        </Link>
      )}
    </li>
  );
}

export function Cluster({
  unit,
  tiles,
  units
}: RowItem & { kind: 'cluster'; units: Unit[] }) {
  const href = usePropertyHref();
  const ticked = useIsSelected(unit._id);
  return (
    <li
      className={cn(
        'col-span-full rounded-md border border-dashed p-3',
        ticked && TICKED
      )}
    >
      <div className="mb-3 flex items-center gap-1.5">
        <SelectCheckbox id={unit._id} name={unit.name} />
        <Link
          href={href(unit)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:underline"
        >
          <PropertyIcon
            type={unit.type}
            className="size-3.5 shrink-0"
            aria-hidden="true"
          />
          {unit.name}
        </Link>
      </div>
      {tiles.length ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
          {tiles.map((tile) => (
            <Tile key={tile._id} unit={tile} units={units} />
          ))}
        </ul>
      ) : (
        <EmptyGroup />
      )}
    </li>
  );
}
