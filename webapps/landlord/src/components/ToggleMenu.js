import { memo, useCallback, useEffect, useState } from 'react';

import Button from '@material-ui/core/Button';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { Typography } from '@material-ui/core';

const ToggleMenu = ({ startIcon, options, value, onChange = () => {} }) => {
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
    <>
      <Button
        aria-controls="select-menu"
        aria-haspopup="true"
        size="large"
        color="default"
        startIcon={startIcon}
        endIcon={<ExpandMoreIcon />}
        onClick={handleClick}
        fullWidth
      >
        <Typography noWrap>
          {selectedOption && selectedOption.label ? selectedOption.label : ''}
        </Typography>
      </Button>
      <Menu
        id="select-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {options.map((option) => (
          <MenuItem key={option.id} onClick={() => onClick(option)}>
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default memo(ToggleMenu);
