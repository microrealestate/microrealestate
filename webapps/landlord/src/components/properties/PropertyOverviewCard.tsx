import AddressMap from '@microrealestate/commonui/components/AddressMap';
import { cn } from '@microrealestate/commonui/utils';
import type { PropertyType } from '@microrealestate/shared';
import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { LuKeyRound } from 'react-icons/lu';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import NumberFormat from '@/components/NumberFormat';
import { Link } from '@/i18n/navigation';
import { useStore } from '@/providers/StoreProvider';
import { ancestors, childUnits, type Unit } from './composition';
import PropertyIcon from './PropertyIcon';

type CurrentUnit = Unit & Pick<PropertyType, 'address'>;

const REGION = 'relative max-h-64 overflow-y-auto';

function byName(a: Unit, b: Unit) {
  return a.name.localeCompare(b.name);
}

function Row({
  unit,
  href,
  current = false,
  className
}: {
  unit: Unit;
  href?: string;
  current?: boolean;
  className?: string;
}) {
  const content = (
    <>
      <PropertyIcon
        type={unit.type}
        className="size-4 shrink-0"
        aria-hidden="true"
      />
      <span className="truncate">{unit.name}</span>
    </>
  );
  const rowClass = cn('flex items-center gap-2 py-0.5', className);
  return current || !href ? (
    <div
      className={cn(
        rowClass,
        '-ml-1 rounded-sm bg-primary pl-1 pr-1 font-medium text-primary-foreground'
      )}
      aria-current="page"
    >
      {content}
    </div>
  ) : (
    <Link
      href={href}
      className={cn(rowClass, '-ml-1 rounded-sm pl-1 pr-1 hover:bg-primary/10')}
    >
      {content}
    </Link>
  );
}

const PropertyOverviewCard = observer(function PropertyOverviewCard() {
  const t = useTranslations('common');
  const store = useStore();
  const selected = store.property.selected as Partial<CurrentUnit>;
  const property = selected._id ? (selected as CurrentUnit) : undefined;
  const units: Unit[] = store.property.items;
  const regionRef = useRef<HTMLElement>(null);
  const currentRef = useRef<HTMLLIElement>(null);

  const propertyId = property?._id;
  const unitCount = units.length;
  // bring the current property into view inside the bounded list only, never
  // by scrolling the page; again once the other properties are loaded
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when the property or the list changes; the refs are read at run time
  useEffect(() => {
    const region = regionRef.current;
    const row = currentRef.current;
    if (region && row && region.contains(row)) {
      region.scrollTop = row.offsetTop;
    }
  }, [propertyId, unitCount]);

  if (!property) {
    return null;
  }
  const href = (unit: Unit) => `/properties/${unit._id}`;
  const path = ancestors(property, units);
  const parent = path.at(-1);
  const children = childUnits(property._id, units).sort(byName);

  const childList = children.length ? (
    <ul className="pl-4">
      {children.map((child) => (
        <li key={child._id}>
          <Row unit={child} href={href(child)} />
        </li>
      ))}
    </ul>
  ) : null;

  const currentItem = (
    <li key={property._id} ref={currentRef}>
      <Row unit={property} current />
      {childList}
    </li>
  );

  const renderLevel = (depth: number) => {
    if (!parent && !children.length) {
      return null;
    }
    if (!parent) {
      return (
        <ul>
          <li>
            <Row unit={property} current />
            {childList ? (
              <section
                ref={regionRef}
                aria-label={t('Properties attached to {name}', {
                  name: property.name
                })}
                className={REGION}
              >
                {childList}
              </section>
            ) : null}
          </li>
        </ul>
      );
    }
    const unit = path[depth];
    return (
      <ul className={cn(depth > 0 && 'pl-4')}>
        <li>
          <Row
            unit={unit}
            href={href(unit)}
            className="text-muted-foreground"
          />
          {unit === parent ? (
            <section
              ref={regionRef}
              aria-label={t('Properties in {name}', { name: parent.name })}
              className={REGION}
            >
              <ul className="pl-4">
                {childUnits(parent._id, units)
                  .sort(byName)
                  .map((sibling) =>
                    sibling._id === property._id ? (
                      currentItem
                    ) : (
                      <li key={sibling._id}>
                        <Row unit={sibling} href={href(sibling)} />
                      </li>
                    )
                  )}
              </ul>
            </section>
          ) : (
            renderLevel(depth + 1)
          )}
        </li>
      </ul>
    );
  };

  return (
    <DashboardCard
      Icon={LuKeyRound}
      title={t('Property')}
      renderContent={() => (
        <div className="text-base space-y-2">
          {property.availableForRent ? (
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <span className="text-muted-foreground">{t('Base rent')}</span>
              <NumberFormat
                value={property.price}
                withColor={undefined}
                debitColor={undefined}
                creditColor={undefined}
                className="text-2xl font-medium"
              />
            </div>
          ) : null}
          {property.address ? <AddressMap address={property.address} /> : null}
          {renderLevel(0)}
        </div>
      )}
    />
  );
});

export default PropertyOverviewCard;
