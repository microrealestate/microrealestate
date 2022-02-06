import { Grid, InputAdornment, TextField } from '@material-ui/core';
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
    <Grid container>
      <Grid item>
        <TextField
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
            width: 300,
          }}
        />
      </Grid>
      <Grid item>
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
      </Grid>
    </Grid>
  );
};

export default SearchFilterBar;
