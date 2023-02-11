import { Box, IconButton } from '@material-ui/core';
import { useCallback, useMemo, useState } from 'react';

import CheckIcon from '@material-ui/icons/Check';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

export default function ToggleMenu({
  startIcon,
  options,
  selectedIds = [],
  multi = false,
  onChange,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const selectedOptions = useMemo(() => {
    return selectedIds.map((id) => options.find((option) => option.id === id));
  }, [options, selectedIds]);

  const handleClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleMenuItemClick = useCallback(
    (option) => () => {
      if (multi === false) {
        onChange([option]);
        handleClose();
      } else {
        let newOptions;
        if (!option?.id) {
          newOptions = [option];
        } else if (selectedOptions.map(({ id }) => id).includes(option.id)) {
          newOptions = selectedOptions.filter(({ id }) => id !== option.id);
        } else {
          newOptions = [...selectedOptions, option];
        }
        onChange(newOptions);
      }
    },
    [handleClose, multi, onChange, selectedOptions]
  );

  return (
    <Box display="flex" flexWrap="nowrap">
      <IconButton color="inherit" onClick={handleClick}>
        {startIcon}
      </IconButton>
      {anchorEl ? (
        <Menu
          id="select-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          {options.map((option) => (
            <MenuItem key={option.label} onClick={handleMenuItemClick(option)}>
              <Box display="flex" justifyContent="center" mr={1}>
                <CheckIcon
                  size="small"
                  color="primary"
                  style={{
                    visibility:
                      (option.id === '' && selectedIds.length === 0) ||
                      selectedIds.includes(option.id)
                        ? 'visible'
                        : 'hidden',
                  }}
                />
              </Box>
              {option.label}
            </MenuItem>
          ))}
        </Menu>
      ) : null}
    </Box>
  );
}
