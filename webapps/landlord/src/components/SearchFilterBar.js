import { Box, InputAdornment, TextField } from '@material-ui/core';
import { useCallback, useEffect, useMemo, useState } from 'react';

import FilterListIcon from '@material-ui/icons/FilterList';
import SearchIcon from '@material-ui/icons/Search';
import ToggleMenu from './ToggleMenu';
import { useTimeout } from '../utils/hooks';
import useTranslation from 'next-translate/useTranslation';

const SearchFilterBar = ({
  filters,
  onSearch,
  defaultValue = { status: '', searchText: '' },
}) => {
  const { t } = useTranslation('common');
  const [filter, setFilter] = useState(defaultValue.status);
  const [searchText, setSearchText] = useState(defaultValue.searchText);
  const triggerSearch = useTimeout(() => {
    onSearch(filter, searchText);
  }, 250);

  useEffect(() => {
    triggerSearch.start();
  }, [filter, searchText, onSearch]);

  return (
    <Box display="flex" alignItems="center">
      <Box flexGrow={1}>
        <TextField
          // fullWidth
          // size="medium"
          placeholder={t('Search')}
          defaultValue={defaultValue.searchText}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          onChange={useCallback(
            (event) => setSearchText(event.target.value || ''),
            []
          )}
          style={{
            width: '400px',
          }}
        />
      </Box>
      <Box>
        <ToggleMenu
          startIcon={<FilterListIcon />}
          options={filters}
          value={useMemo(
            () =>
              filters.find((f) => f.id === defaultValue.status) || filters[0],
            [defaultValue, filters]
          )}
          onChange={useCallback((option) => setFilter(option.id), [])}
        />
      </Box>
    </Box>
  );
};

export default SearchFilterBar;
