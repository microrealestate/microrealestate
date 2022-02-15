import { Box, IconButton, Typography, withStyles } from '@material-ui/core';

import { hexToRgb } from '../styles/styles';
import { useCallback } from 'react';
import { useStyles } from '../styles/components/Nav.styles';

const StyledButton = withStyles((theme) => ({
  root: {
    color: 'rgba(' + hexToRgb(theme.palette.common.white) + ', 0.8)',
    borderRadius: 0,
  },
}))(IconButton);

const MobileMenuButton = ({ item, selected, onClick }) => {
  const classes = useStyles();

  const handleClick = useCallback(() => {
    onClick(item);
  }, [item, onClick]);

  return (
    <Box>
      <StyledButton
        className={`${classes.item} ${
          selected ? classes.mobileItemSelected : ''
        }`}
        onClick={handleClick}
      >
        <Box display="flex" flexDirection="column">
          <Box>{item.icon}</Box>
          <Typography variant="caption" component="div" noWrap>
            {item.value}
          </Typography>
        </Box>
      </StyledButton>
    </Box>
  );
};

export default MobileMenuButton;
