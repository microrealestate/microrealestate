import { InputAdornment, TextField } from '@material-ui/core';
import { useCallback, useTransition } from 'react';

import SearchIcon from '@material-ui/icons/Search';
import useTranslation from 'next-translate/useTranslation';

const SearchBar = ({ onSearch, defaultValue = '' }) => {
  const { t } = useTranslation('common');
  const [, startTransition] = useTransition();

  const onChange = useCallback(
    (event) => {
      startTransition(() => {
        onSearch(event.target.value || '');
      });
    },
    [onSearch]
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
