import { cn } from '@microrealestate/commonui/utils';
import { useTranslations } from 'next-intl';
import { SelectCheckbox, useIsSelected } from '@/components/MultiSelection';
import { Link } from '@/i18n/navigation';
import type { Unit } from '../composition';
import PropertyIcon from '../PropertyIcon';
import { type Block, type Row, rowTiles, tilesIn } from '../stackingPlan';
import { EmptyGroup, TICKED, usePropertyHref } from './shared';
import { Cluster, Tile } from './Tile';

function PlanRow({ row, units }: { row: Row; units: Unit[] }) {
  const href = usePropertyHref();
  const ticked = useIsSelected(row.label?._id);
  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-start',
        row.label && 'rounded-lg border-2 border-dotted p-3',
        ticked && TICKED
      )}
    >
      {row.label ? (
        <div className="text-sm text-muted-foreground sm:w-32 sm:shrink-0 sm:pt-2">
          <span className="flex items-center gap-1.5">
            <SelectCheckbox id={row.label._id} name={row.label.name} />
            <Link href={href(row.label)} className="hover:underline">
              {row.label.name}
            </Link>
          </span>
        </div>
      ) : null}
      {row.items.length ? (
        <ul className="grid min-w-0 flex-1 grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
          {row.items.map((item) =>
            item.kind === 'tile' ? (
              <Tile key={item.unit._id} unit={item.unit} units={units} />
            ) : (
              <Cluster key={item.unit._id} {...item} units={units} />
            )
          )}
        </ul>
      ) : (
        <div className="sm:pt-2">
          <EmptyGroup />
        </div>
      )}
    </div>
  );
}

export function GroupHeader({
  block,
  units,
  as: Heading
}: {
  block: Block;
  units: Unit[];
  as: 'h2' | 'h3' | 'h4';
}) {
  const t = useTranslations('common');
  const href = usePropertyHref();
  const { group } = block;
  const ticked = useIsSelected(group?._id);
  const tiles = (
    group
      ? tilesIn(group, units)
      : block.content.flatMap((part) =>
          part.kind === 'row' ? rowTiles(part) : []
        )
  ).filter((unit) => unit.availableForRent);
  const rented = tiles.filter(({ status }) => status === 'occupied').length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {group ? (
        <Heading
          className={cn(
            'flex items-center gap-2 font-semibold',
            Heading === 'h2' ? 'text-base' : 'text-sm',
            ticked && '-mx-1 rounded-md bg-primary/10 px-1'
          )}
        >
          <SelectCheckbox id={group._id} name={group.name} />
          <Link
            href={href(group)}
            className="flex items-center gap-2 hover:underline"
          >
            <PropertyIcon
              type={group.type}
              className="size-5 shrink-0"
              aria-hidden="true"
            />
            {group.name}
          </Link>
        </Heading>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted-foreground">
        {t(
          '{total, plural, one {# property} other {# properties}} · {rented} rented',
          { total: tiles.length, rented }
        )}
      </span>
    </div>
  );
}

export function BlockContent({
  block,
  units,
  depth
}: {
  block: Block;
  units: Unit[];
  depth: number;
}) {
  if (!block.content.length) {
    return <EmptyGroup />;
  }
  return (
    <>
      {block.content.map((part) =>
        part.kind === 'row' ? (
          <PlanRow key={part.key} row={part} units={units} />
        ) : (
          <section key={part.key} className="space-y-3 border-t pt-3 pl-3">
            <GroupHeader
              block={part}
              units={units}
              as={depth === 0 ? 'h3' : 'h4'}
            />
            <BlockContent block={part} units={units} depth={depth + 1} />
          </section>
        )
      )}
    </>
  );
}
