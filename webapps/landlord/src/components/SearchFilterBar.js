import { Button } from '@microrealestate/commonui/components/ui/button';
import { Checkbox } from '@microrealestate/commonui/components/ui/checkbox';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
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
import moment from 'moment';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { LuFilter, LuTrash } from 'react-icons/lu';
import { useDebounceCallback, useMediaQuery } from 'usehooks-ts';
import { usePathname, useRouter } from '@/i18n/navigation';
import ToggleMenu from './ToggleMenu';

const MAX_VISIBLE_FILTER_VALUES = 2;
const PERIOD_DATE_FORMAT = 'YYYY-MM-DD';

function readPeriodFromParams(searchParams, periodFilter) {
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

function FilterBar({ label, values, selectedIds = [], onChange, dataCy }) {
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
      multi
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

  const toggle = (filterId, valueId) => {
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
        <DrawerFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={handleClear}>
            {t('Clear')}
          </Button>
          <Button className="flex-1" onClick={handleApply}>
            {t('Apply')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default function SearchFilterBar({ filters = [], onSearch, className }) {
  const t = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const periodFilter = useMemo(
    () => filters.find((f) => f.type === 'period') ?? null,
    [filters]
  );
  const selectFilters = useMemo(
    () => filters.filter((f) => f.type !== 'period'),
    [filters]
  );
  const buildEmitIds = useCallback(
    (ids, nextPeriod) =>
      periodFilter ? { ...ids, [periodFilter.id]: nextPeriod ?? null } : ids,
    [periodFilter]
  );

  const [searchText, setSearchText] = useState(
    searchParams.get('search') || ''
  );

  const [period, setPeriod] = useState(() =>
    readPeriodFromParams(searchParams, periodFilter)
  );

  const [selectedFilterIds, setSelectedFilterIds] = useState(() => {
    const queryFilters = Array.from(searchParams.keys()).filter((key) =>
      key.startsWith('filter.')
    );

    let result = queryFilters.reduce((acc, queryFilter) => {
      acc[queryFilter] = (searchParams.get(queryFilter) || '')
        .split(',')
        .filter(Boolean)
        .map((value) => decodeURI(value));
      return acc;
    }, {});

    if (!Object.keys(result).length && selectFilters.length) {
      const defaultFilters = selectFilters.filter(({ isDefault }) => isDefault);
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
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: hydrate parent once on mount only
  useEffect(() => {
    onSearch(buildEmitIds(selectedFilterIds, period), searchText);
  }, []);

  const updateBrowserUrl = useCallback(
    (inputSelectedIds, inputSearchText, inputPeriod, resetPage = false) => {
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
      router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
    },
    [selectFilters, pathname, router, searchParams]
  );

  const emitRef = useRef(null);
  emitRef.current = (selIds, text, nextPeriod) => {
    updateBrowserUrl(selIds, text, nextPeriod, true);
    onSearch(buildEmitIds(selIds, nextPeriod), text);
  };
  const stableEmit = useCallback(
    (selIds, text, nextPeriod) => emitRef.current?.(selIds, text, nextPeriod),
    []
  );
  const debouncedEmit = useDebounceCallback(stableEmit, 300);

  const handleTextChange = useCallback(
    (event) => {
      const newSearchText = (event.target.value || '').trim();
      setSearchText(newSearchText);
      debouncedEmit(selectedFilterIds, newSearchText, period);
    },
    [debouncedEmit, selectedFilterIds, period]
  );

  const commit = useCallback(
    (nextIds, nextText, nextPeriod) => {
      debouncedEmit.flush();
      setSelectedFilterIds(nextIds);
      setPeriod(nextPeriod);
      updateBrowserUrl(nextIds, nextText, nextPeriod, true);
      onSearch(buildEmitIds(nextIds, nextPeriod), nextText);
    },
    [updateBrowserUrl, onSearch, buildEmitIds, debouncedEmit]
  );

  const handleFilterChange = useCallback(
    (filter) => (updatedFilters) => {
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
    (nextPeriod) => commit(selectedFilterIds, searchText, nextPeriod),
    [commit, searchText, selectedFilterIds]
  );

  const handleApplyMobile = useCallback(
    (nextIds, nextPeriod) => commit(nextIds, searchText, nextPeriod),
    [commit, searchText]
  );

  const handleClearAll = useCallback(() => {
    let clearedPeriod = null;
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

  if (isDesktop) {
    return (
      <div className={cn('flex flex-row items-center gap-2', className)}>
        <Input
          defaultValue={searchText}
          placeholder={t('Search')}
          onChange={handleTextChange}
          className="md:w-60"
          data-cy="globalSearchField"
        />
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
    );
  }

  const hasMobileExtras = selectFilters.length > 0 || !!periodFilter;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-row items-center gap-2">
        <Input
          defaultValue={searchText}
          placeholder={t('Search')}
          onChange={handleTextChange}
          className="flex-1"
          data-cy="globalSearchField"
        />
        {hasMobileExtras ? (
          <Button
            variant="outline"
            onClick={() => setDrawerOpen(true)}
            className="gap-2 shrink-0"
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
      </div>
      {hasMobileExtras ? (
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
