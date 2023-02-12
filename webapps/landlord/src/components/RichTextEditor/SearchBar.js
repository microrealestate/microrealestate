import { InputAdornment, TextField } from '@material-ui/core';
import { useCallback, useTransition } from 'react';

import SearchIcon from '@material-ui/icons/Search';
import useTimeout from '../../hooks/useTimeout';
import useTranslation from 'next-translate/useTranslation';

const SearchBar = ({ onSearch, defaultValue = '' }) => {
  const { t } = useTranslation('common');
  const [, startTransition] = useTransition();

  const triggerSearch = useTimeout((searchText) => {
    startTransition(() => {
      onSearch(searchText);
    });
  }, 250);

  const onChange = useCallback(
    (event) => {
      triggerSearch.start(event.target.value || '');
    },
    [triggerSearch]
  );

  return (
    <TextField
      fullWidth
      placeholder={t('Search')}
      defaultValue={defaultValue}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
      onChange={onChange}
    />
  );
};

export default SearchBar;
