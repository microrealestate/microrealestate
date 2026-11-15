import { Button } from '@microrealestate/commonui/components/ui/button';
import { Checkbox } from '@microrealestate/commonui/components/ui/checkbox';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle
} from '@microrealestate/commonui/components/ui/drawer';
import { Input } from '@microrealestate/commonui/components/ui/input';
import {
  bucketBounds,
  PeriodRangePicker
} from '@microrealestate/commonui/components/ui/PeriodRangePicker';
import { Separator } from '@microrealestate/commonui/components/ui/separator';
import { cn } from '@microrealestate/commonui/utils';
import type { LeaseTimeRange } from '@microrealestate/shared';
import moment, { type Moment } from 'moment';
import { type ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  type ChangeEvent,
  Fragment,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { LuFilter, LuSearch, LuTrash, LuX } from 'react-icons/lu';
import { useDebounceCallback } from 'usehooks-ts';
import { usePathname, useRouter } from '@/i18n/navigation';
import DrawerActionBar from './DrawerActionBar';
import ToggleMenu, { type ToggleMenuOption } from './ToggleMenu';

const MAX_VISIBLE_FILTER_VALUES = 2;
const PERIOD_DATE_FORMAT = 'YYYY-MM-DD';

export type Period = { from: Moment; to: Moment } | null;

export type FilterValue = ToggleMenuOption & { isDefault?: boolean };

export type SelectFilter = {
  id: string;
  type?: undefined;
  label: ReactNode;
  values: FilterValue[];
  isDefault?: boolean;
};

export type PeriodFilter = {
  id: string;
  type: 'period';
  label?: ReactNode;
  timeRange: LeaseTimeRange;
  defaultPeriod?: Moment | null;
  clearable?: boolean;
};

export type SearchFilter = SelectFilter | PeriodFilter;

type SelectedIds = Record<string, string[]>;

type Emit = (selIds: SelectedIds, text: string, nextPeriod: Period) => void;

export type SearchSelection = Record<string, string[] | Period>;

export function selectedValues(
  selection: SearchSelection,
  filterId: string
): string[] {
  const value = selection[filterId];
  return Array.isArray(value) ? value : [];
}

function readPeriodFromParams(
  searchParams: ReadonlyURLSearchParams,
  periodFilter: PeriodFilter | null
): Period {
  if (!periodFilter) return null;
  const { timeRange, defaultPeriod } = periodFilter;
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  if (fromParam && toParam) {
    return {
      from: moment(fromParam, PERIOD_DATE_FORMAT),
      to: moment(toParam, PERIOD_DATE_FORMAT)
    };
  }
  if (defaultPeriod === null) return null;
  return bucketBounds(defaultPeriod ?? moment(), timeRange);
}

type FilterBarProps = {
  label: ReactNode;
  values: FilterValue[];
  selectedIds?: string[];
  onChange: (selectedValues: FilterValue[]) => void;
  dataCy?: string;
};

function FilterBar({
  label,
  values,
  selectedIds = [],
  onChange,
  dataCy
}: FilterBarProps) {
  const visibleValues = useMemo(
    () =>
      values
        .filter(({ id }) => selectedIds.includes(id))
        .slice(0, MAX_VISIBLE_FILTER_VALUES),
    [values, selectedIds]
  );

  const hiddenFiltersCount = selectedIds.length - MAX_VISIBLE_FILTER_VALUES;

  return (
    <ToggleMenu
      options={values}
      selectedIds={selectedIds}
      onChange={onChange}
      dataCy={dataCy}
    >
      <Button
        variant="secondary"
        className="flex rounded-md border-dotted border-2 p-2 w-fit font-medium text-sm"
      >
        <div className={'flex items-center gap-1'}>
          {!selectedIds.length ? (
            <div className="inline-block align-middle">{label}</div>
          ) : (
            visibleValues.map((status) => (
              <Fragment key={status.id}>
                <span>{status.label}</span>
                <Separator
                  orientation="vertical"
                  className="h-6 bg-secondary-foreground/25 last-of-type:hidden mx-1"
                />
              </Fragment>
            ))
          )}
          {hiddenFiltersCount > 0 ? <div>+ {hiddenFiltersCount}</div> : null}
        </div>
      </Button>
    </ToggleMenu>
  );
}

function MobileFiltersDrawer({
  open,
  onOpenChange,
  filters,
  initialSelectedIds,
  initialPeriod,
  periodFilter,
  onApply
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: SelectFilter[];
  initialSelectedIds: SelectedIds;
  initialPeriod: Period;
  periodFilter: PeriodFilter | null;
  onApply: (selectedIds: SelectedIds, period: Period) => void;
}) {
  const t = useTranslations('common');
  const [draftIds, setDraftIds] = useState(initialSelectedIds);
  const [draftPeriod, setDraftPeriod] = useState(initialPeriod);

  useEffect(() => {
    if (open) {
      setDraftIds(initialSelectedIds);
      setDraftPeriod(initialPeriod);
    }
  }, [open, initialSelectedIds, initialPeriod]);

  const toggle = (filterId: string, valueId: string) => {
    setDraftIds((prev) => {
      const current = prev[filterId] || [];
      const next = current.includes(valueId)
        ? current.filter((id) => id !== valueId)
        : [...current, valueId];
      const out = { ...prev };
      if (next.length) {
        out[filterId] = next;
      } else {
        delete out[filterId];
      }
      return out;
    });
  };

  const handleClear = () => {
    setDraftIds({});
    if (periodFilter) {
      if (periodFilter.clearable === false) {
        setDraftPeriod(
          bucketBounds(
            periodFilter.defaultPeriod ?? moment(),
            periodFilter.timeRange
          )
        );
      } else {
        setDraftPeriod(null);
      }
    }
  };
  const handleApply = () => {
    onApply(draftIds, draftPeriod);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>{t('Filters')}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2 overflow-y-auto space-y-5">
          {periodFilter ? (
            <div data-cy="mobileFilter-period">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                {periodFilter.label ?? t('Period')}
              </h3>
              <PeriodRangePicker
                timeRange={periodFilter.timeRange}
                from={draftPeriod?.from ?? null}
                onChange={setDraftPeriod}
                clearable={periodFilter.clearable ?? true}
              />
            </div>
          ) : null}
          {filters.map(({ id, label, values }) => (
            <div key={id} data-cy={`mobileFilter-${id}`}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                {label}
              </h3>
              <ul className="space-y-1">
                {values.map((value) => {
                  const checked = (draftIds[id] || []).includes(value.id);
                  const optionId = `mobile-filter-${id}-${value.id}`;
                  return (
                    <li key={value.id}>
                      <label
                        htmlFor={optionId}
                        className="flex items-center gap-3 w-full py-3 px-2 rounded-md hover:bg-primary/10 cursor-pointer"
                      >
                        <Checkbox
                          id={optionId}
                          checked={checked}
                          onCheckedChange={() => toggle(id, value.id)}
                        />
                        <span className="text-sm">{value.label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <DrawerActionBar>
          <Button variant="outline" onClick={handleClear}>
            {t('Clear')}
          </Button>
          <Button onClick={handleApply}>{t('Apply')}</Button>
        </DrawerActionBar>
      </DrawerContent>
    </Drawer>
  );
}

type SearchFilterBarProps = {
  filters?: SearchFilter[];
  onSearch: (selection: SearchSelection, searchText: string) => void;
  placeholder?: string;
  className?: string;
};

export default function SearchFilterBar({
  filters = [],
  onSearch,
  placeholder,
  className
}: SearchFilterBarProps) {
  const t = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const periodFilter = useMemo(
    () => filters.find((f): f is PeriodFilter => f.type === 'period') ?? null,
    [filters]
  );
  const selectFilters = useMemo(
    () => filters.filter((f): f is SelectFilter => f.type !== 'period'),
    [filters]
  );
  const buildEmitIds = useCallback(
    (ids: SelectedIds, nextPeriod: Period): SearchSelection =>
      periodFilter ? { ...ids, [periodFilter.id]: nextPeriod ?? null } : ids,
    [periodFilter]
  );

  const [searchText, setSearchText] = useState(
    searchParams.get('search') || ''
  );

  const [period, setPeriod] = useState<Period>(() =>
    readPeriodFromParams(searchParams, periodFilter)
  );

  const [selectedFilterIds, setSelectedFilterIds] = useState<SelectedIds>(
    () => {
      const queryFilters = Array.from(searchParams.keys()).filter((key) =>
        key.startsWith('filter.')
      );

      let result = queryFilters.reduce<SelectedIds>((acc, queryFilter) => {
        acc[queryFilter] = (searchParams.get(queryFilter) || '')
          .split(',')
          .filter(Boolean)
          .map((value) => decodeURI(value));
        return acc;
      }, {});

      if (!Object.keys(result).length && selectFilters.length) {
        const defaultFilters = selectFilters.filter(
          ({ isDefault }) => isDefault
        );
        if (defaultFilters.length) {
          const defaultFilter = defaultFilters[0];
          let defaultValues = defaultFilter.values
            .filter(({ isDefault }) => isDefault)
            .map(({ id }) => id);
          if (!defaultValues.length && defaultFilter.values.length) {
            defaultValues = [defaultFilter.values[0].id];
          }
          result = {
            [defaultFilter.id]: defaultValues
          };
        }
      }
      return result;
    }
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: hydrate parent once on mount only
  useEffect(() => {
    onSearch(buildEmitIds(selectedFilterIds, period), searchText);
  }, []);

  const updateBrowserUrl = useCallback(
    (
      inputSelectedIds: SelectedIds,
      inputSearchText: string,
      inputPeriod: Period,
      resetPage = false
    ) => {
      const params = new URLSearchParams(searchParams.toString());

      if (resetPage) {
        params.delete('page');
      }
      params.delete('search');

      if (inputSearchText) {
        params.set('search', inputSearchText);
      }

      params.delete('from');
      params.delete('to');
      if (inputPeriod?.from && inputPeriod?.to) {
        params.set('from', inputPeriod.from.format(PERIOD_DATE_FORMAT));
        params.set('to', inputPeriod.to.format(PERIOD_DATE_FORMAT));
      }

      selectFilters
        .map(({ id }) => id)
        .forEach((filter) => {
          params.delete(filter);
          if (inputSelectedIds[filter]?.length) {
            params.set(
              filter,
              inputSelectedIds[filter]
                .map((value) => encodeURIComponent(value))
                .join(',')
            );
          }
        });

      const queryString = params.toString();
      router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, {
        scroll: false
      });
    },
    [selectFilters, pathname, router, searchParams]
  );

  const emitRef = useRef<Emit | null>(null);
  emitRef.current = (selIds, text, nextPeriod) => {
    updateBrowserUrl(selIds, text, nextPeriod, true);
    onSearch(buildEmitIds(selIds, nextPeriod), text);
  };
  const stableEmit = useCallback(
    (selIds: SelectedIds, text: string, nextPeriod: Period) =>
      emitRef.current?.(selIds, text, nextPeriod),
    []
  );
  const debouncedEmit = useDebounceCallback(stableEmit, 300);

  const handleTextChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const newSearchText = (event.target.value || '').trim();
      setSearchText(newSearchText);
      debouncedEmit(selectedFilterIds, newSearchText, period);
    },
    [debouncedEmit, selectedFilterIds, period]
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const handleClearText = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
    setSearchText('');
    debouncedEmit.cancel();
    stableEmit(selectedFilterIds, '', period);
  }, [debouncedEmit, stableEmit, selectedFilterIds, period]);

  const commit = useCallback(
    (nextIds: SelectedIds, nextText: string, nextPeriod: Period) => {
      debouncedEmit.flush();
      setSelectedFilterIds(nextIds);
      setPeriod(nextPeriod);
      updateBrowserUrl(nextIds, nextText, nextPeriod, true);
      onSearch(buildEmitIds(nextIds, nextPeriod), nextText);
    },
    [updateBrowserUrl, onSearch, buildEmitIds, debouncedEmit]
  );

  const handleFilterChange = useCallback(
    (filter: string) => (updatedFilters: FilterValue[]) => {
      const ids = updatedFilters.map(({ id }) => id);
      const next = { ...selectedFilterIds };
      if (ids.length) {
        next[filter] = ids;
      } else {
        delete next[filter];
      }
      commit(next, searchText, period);
    },
    [commit, searchText, selectedFilterIds, period]
  );

  const handlePeriodChange = useCallback(
    (nextPeriod: Period) => commit(selectedFilterIds, searchText, nextPeriod),
    [commit, searchText, selectedFilterIds]
  );

  const handleApplyMobile = useCallback(
    (nextIds: SelectedIds, nextPeriod: Period) =>
      commit(nextIds, searchText, nextPeriod),
    [commit, searchText]
  );

  const handleClearAll = useCallback(() => {
    let clearedPeriod: Period = null;
    if (periodFilter && periodFilter.clearable === false) {
      clearedPeriod = bucketBounds(
        periodFilter.defaultPeriod ?? moment(),
        periodFilter.timeRange
      );
    }
    commit({}, searchText, clearedPeriod);
  }, [commit, searchText, periodFilter]);

  const canRemoveFilters = useMemo(() => {
    const periodActive = !!period?.from && periodFilter?.clearable !== false;
    return (
      Object.values(selectedFilterIds).reduce(
        (sum, ids) => sum + (ids?.length || 0),
        0
      ) +
        (periodActive ? 1 : 0) >
      0
    );
  }, [selectedFilterIds, period, periodFilter]);

  const totalSelected = useMemo(
    () =>
      Object.values(selectedFilterIds).reduce(
        (sum, ids) => sum + (ids?.length || 0),
        0
      ),
    [selectedFilterIds]
  );

  const hasExtras = selectFilters.length > 0 || !!periodFilter;

  return (
    <div className={cn('flex flex-row items-center gap-2', className)}>
      <div className="relative flex-1 md:flex-none md:w-96">
        <LuSearch
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          defaultValue={searchText}
          placeholder={placeholder || t('Search')}
          aria-label={placeholder || t('Search')}
          onChange={handleTextChange}
          className="truncate pl-9 pr-10 [&::-webkit-search-cancel-button]:hidden"
          data-cy="globalSearchField"
        />
        {searchText ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClearText}
            className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-muted-foreground"
            aria-label={t('Clear search')}
            data-cy="clearSearch"
          >
            <LuX className="size-4" />
          </Button>
        ) : null}
      </div>
      {hasExtras || canRemoveFilters ? (
        <div className="hidden md:flex flex-row items-center gap-2">
          {periodFilter ? (
            <PeriodRangePicker
              timeRange={periodFilter.timeRange}
              from={period?.from ?? null}
              onChange={handlePeriodChange}
              dataCy="periodPicker"
              clearable={periodFilter.clearable ?? true}
            />
          ) : null}
          {selectFilters.map(({ id, label, values }) => (
            <FilterBar
              key={id}
              label={label}
              values={values}
              selectedIds={selectedFilterIds[id]}
              onChange={handleFilterChange(id)}
              dataCy={id}
            />
          ))}
          {canRemoveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              data-cy="clearFilters"
              aria-label={t('Clear')}
            >
              <LuTrash className="size-4" />
            </Button>
          ) : null}
        </div>
      ) : null}
      {hasExtras ? (
        <Button
          variant="outline"
          onClick={() => setDrawerOpen(true)}
          className="gap-2 shrink-0 md:hidden"
          data-cy="mobileFiltersButton"
          aria-label={t('Filters')}
        >
          <LuFilter className="size-4" />
          {totalSelected > 0 ? (
            <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-1.5 min-w-5 text-center">
              {totalSelected}
            </span>
          ) : null}
        </Button>
      ) : null}
      {hasExtras ? (
        <MobileFiltersDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          filters={selectFilters}
          initialSelectedIds={selectedFilterIds}
          initialPeriod={period}
          periodFilter={periodFilter}
          onApply={handleApplyMobile}
        />
      ) : null}
    </div>
  );
}
