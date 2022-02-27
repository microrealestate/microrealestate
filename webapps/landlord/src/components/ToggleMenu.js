import { Box, IconButton, Typography } from '@material-ui/core';
import { memo, useCallback, useEffect, useState } from 'react';

import Button from '@material-ui/core/Button';
import CheckIcon from '@material-ui/icons/Check';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

const ToggleMenu = ({
  startIcon,
  options,
  value,
  onChange,
  noLabel = false,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOption, setSelectedOption] = useState(value);

  useEffect(() => {
    setSelectedOption(value);
  }, [value]);

  const handleClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const onClick = useCallback(
    (option) => {
      setSelectedOption(option);
      onChange(option);
      handleClose();
    },
    [onChange, handleClose]
  );

  return (
    <Box display="flex" flexWrap="nowrap">
      {!noLabel ? (
        <Button
          aria-controls="select-menu"
          aria-haspopup="true"
          size="large"
          color="inherit"
          startIcon={startIcon}
          endIcon={<ExpandMoreIcon />}
          onClick={handleClick}
          fullWidth
        >
          <Typography noWrap>
            {selectedOption && selectedOption.label ? selectedOption.label : ''}
          </Typography>
        </Button>
      ) : (
        <IconButton color="inherit" onClick={handleClick}>
          {startIcon}
        </IconButton>
      )}
      <Menu
        id="select-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {options.map((option) => (
          <MenuItem key={option.id} onClick={() => onClick(option)}>
            <Box display="flex" justifyContent="center" mr={1}>
              <CheckIcon
                size="small"
                color="primary"
                style={{
                  visibility: option?.id === value?.id ? 'visible' : 'hidden',
                }}
              />
            </Box>
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default memo(ToggleMenu);
