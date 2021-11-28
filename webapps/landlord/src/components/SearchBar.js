import { InputAdornment, TextField } from '@material-ui/core';
import { useCallback, useEffect, useState } from 'react';

import SearchIcon from '@material-ui/icons/Search';
import { useTimeout } from '../utils/hooks';
import useTranslation from 'next-translate/useTranslation';

const SearchBar = ({ onSearch, defaultValue = '' }) => {
  const { t } = useTranslation('common');
  const [searchText, setSearchText] = useState(defaultValue);
  const triggerSearch = useTimeout(() => {
    onSearch(searchText);
  }, 250);

  useEffect(() => {
    triggerSearch.start();
  }, [searchText, onSearch]);

  const onChange = useCallback(
    (event) => setSearchText(event.target.value || ''),
    []
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
