import { buildPathname, cn } from '../utils';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition
} from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { LuPlusCircle } from 'react-icons/lu';
import { Separator } from './ui/separator';
import ToggleMenu from './ToggleMenu';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

function FilterBar({ filters, selectedFilterIds, onChange }) {
  const { t } = useTranslation('common');

  const visibleFilters = useMemo(() => {
    const selectedFilters = filters.filter((filter) =>
      selectedFilterIds.includes(filter.id)
    );
    let visibleFilters = selectedFilters;

    if (selectedFilters.length >= 4) {
      visibleFilters = [
        selectedFilters[0],
        { id: '__more__', label: '...' },
        selectedFilters[selectedFilters.length - 2],
        selectedFilters[selectedFilters.length - 1]
      ];
    }

    return visibleFilters;
  }, [filters, selectedFilterIds]);

  return (
    <ToggleMenu
      options={filters}
      selectedIds={selectedFilterIds}
      onChange={onChange}
      multi
    >
      <Button
        variant="secondary"
        className="flex rounded-md border-dotted border-2 p-2 w-fit"
      >
        <div className="flex items-center gap-1.5">
          <div>
            <LuPlusCircle className="inline-block align-middle size-4" />
            <div className="inline-block align-middle ml-1">{t('Filters')}</div>
          </div>
          {selectedFilterIds.length > 0 ? (
            <Separator
              orientation="vertical"
              className="h-6 bg-secondary-foreground/25"
              decorative
            />
          ) : null}

          {visibleFilters.map((status) => {
            if (status.id === '__more__') {
              return <span key={status.id}>{status.label}</span>;
            }
            return (
              <Badge
                key={status.id}
                variant="secondary"
                className="rounded-none h-6"
              >
                <span>{status.label}</span>
              </Badge>
            );
          })}
        </div>
      </Button>
    </ToggleMenu>
  );
}

export default function SearchFilterBar({ filters = [], onSearch, className }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [searchText, setSearchText] = useState(router.query.search || '');
  const [selectedFilterIds, setSelectedFilterIds] = useState(
    router.query.statuses?.split(',') || []
  );

  useEffect(() => {
    const selectedFilters = filters.filter(({ id }) =>
      selectedFilterIds.includes(id)
    );
    onSearch(selectedFilters, searchText);
  }, [filters, onSearch, searchText, selectedFilterIds]);

  const currentSelectedStatus = useMemo(() => {
    return filters.filter(({ id }) => selectedFilterIds.includes(id));
  }, [selectedFilterIds, filters]);

  const triggerSearch = useCallback(
    (inputSelectedStatus, inputSearchText) => {
      startTransition(() => {
        const searchQuery = {};
        delete router.query.search;
        delete router.query.statuses;
        if (inputSearchText) {
          searchQuery.search = inputSearchText;
        }
        if (inputSelectedStatus.length) {
          searchQuery.statuses = inputSelectedStatus
            .map(({ id }) => id)
            .join(',');
        }
        router.push(
          {
            pathname: router.pathname,
            query:
              Object.keys(router.query).length ||
              Object.keys(searchQuery).length
                ? {
                    ...router.query,
                    ...searchQuery
                  }
                : {}
          },
          undefined,
          { shallow: true }
        );
        onSearch(inputSelectedStatus, inputSearchText);
      });
    },
    [onSearch, router]
  );

  const handleTextChange = useCallback(
    (event) => {
      const searchText = event.target.value || '';
      setSearchText(searchText);
      triggerSearch(currentSelectedStatus, searchText.trim());
    },
    [currentSelectedStatus, triggerSearch]
  );

  const handleFilterChange = useCallback(
    (values) => {
      setSelectedFilterIds(values.map(({ id }) => id));
      triggerSearch(values, searchText);
    },
    [searchText, triggerSearch]
  );

  return (
    <div className={cn('flex flex-col md:flex-row gap-2', className)}>
      <Input
        defaultValue={searchText}
        placeholder={t('Search')}
        onChange={handleTextChange}
        className="md:w-60"
        data-cy="globalSearchField"
      />
      {filters?.length ? (
        <FilterBar
          filters={filters}
          selectedFilterIds={selectedFilterIds}
          onChange={handleFilterChange}
        />
      ) : null}
    </div>
  );
}
