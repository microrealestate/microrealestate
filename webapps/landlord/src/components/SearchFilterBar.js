import {
  Box,
  Chip,
  InputAdornment,
  TextField,
  withStyles,
} from '@material-ui/core';
import { useCallback, useMemo, useTransition } from 'react';

import FilterListIcon from '@material-ui/icons/FilterList';
import SearchIcon from '@material-ui/icons/Search';
import ToggleMenu from './ToggleMenu';
import useTranslation from 'next-translate/useTranslation';

const StyledTextField = withStyles({
  root: {
    width: '100%',
    '& .MuiInput-root': {
      color: 'inherit',
      '& .MuiInputAdornment-root': {
        color: 'inherit',
      },
    },
  },
})(TextField);

export default function SearchFilterBar({
  searchText = '',
  selectedIds = [],
  statusList = [],
  onSearch,
}) {
  const { t } = useTranslation('common');
  const [, startTransition] = useTransition();
  const currentSelectedStatus = useMemo(() => {
    return selectedIds.map((value) =>
      statusList.find(({ id }) => id === value)
    );
  }, [selectedIds, statusList]);

  const triggerSearch = useCallback(
    (inputSelectedStatus, inputSearchText) => {
      startTransition(() => {
        onSearch(inputSelectedStatus, inputSearchText);
      });
    },
    [onSearch]
  );

  const handleTextChange = useCallback(
    (event) => {
      triggerSearch(currentSelectedStatus, event.target.value || '');
    },
    [currentSelectedStatus, triggerSearch]
  );

  const handleToggleChange = useCallback(
    (values) => {
      triggerSearch(values, searchText);
    },
    [searchText, triggerSearch]
  );

  const handleDeleteFilter = useCallback(
    (item) => () => {
      const values = currentSelectedStatus.filter(({ id }) => item.id !== id);
      triggerSearch(values, searchText);
    },
    [currentSelectedStatus, searchText, triggerSearch]
  );

  return (
    <Box mb={1}>
      <Box display="flex" flexWrap="nowrap" alignItems="center" width={330}>
        <Box flexGrow={1}>
          <StyledTextField
            placeholder={t('Search')}
            defaultValue={searchText}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            onChange={handleTextChange}
          />
        </Box>
        <ToggleMenu
          startIcon={<FilterListIcon />}
          options={statusList}
          selectedIds={selectedIds}
          onChange={handleToggleChange}
          multi
        />
      </Box>
      <Box display="flex" gridGap={10} py={0.5}>
        {selectedIds
          .filter((id) => id !== '')
          .map((id) => statusList.find((status) => status?.id === id))
          .map((status) => (
            <Chip
              key={status.id}
              label={status.label}
              size="small"
              onDelete={handleDeleteFilter(status)}
            />
          ))}
      </Box>
    </Box>
  );
}
