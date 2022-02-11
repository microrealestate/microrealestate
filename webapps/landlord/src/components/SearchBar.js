import { InputAdornment, TextField } from '@material-ui/core';
import { useCallback, useState } from 'react';

import SearchIcon from '@material-ui/icons/Search';
import { useTimeout } from '../utils/hooks';
import useTranslation from 'next-translate/useTranslation';

const SearchBar = ({ onSearch, defaultValue = '' }) => {
  const { t } = useTranslation('common');
  const [searchText, setSearchText] = useState(defaultValue);
  const triggerSearch = useTimeout(() => {
    onSearch(searchText);
  }, 250);

  // TODO: use useEffect to trigger the search
  // commented as now this cause infinite rendering loop
  // useEffect(() => {
  //   triggerSearch.start();
  // }, [searchText, onSearch]);

  const onChange = useCallback(
    (event) => {
      setSearchText(event.target.value || '');
      // this hack works without useEffect because the action
      // is triggered 250ms later after the state update
      triggerSearch.start();
    },
    [setSearchText, triggerSearch]
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
