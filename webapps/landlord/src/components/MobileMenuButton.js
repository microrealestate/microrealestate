import {
  Box,
  IconButton,
  Typography,
  useTheme,
  withStyles,
} from '@material-ui/core';

import { hexToRgb } from '../styles/styles';
import { useCallback } from 'react';

const StyledButton = withStyles((theme) => ({
  root: {
    width: '100%',
    color: 'rgba(' + hexToRgb(theme.palette.common.white) + ', 0.8)',
    borderRadius: 0,
    paddingTop: 6,
    paddingBottom: 6,
  },
}))(IconButton);

const MobileMenuButton = ({ item, selected, onClick }) => {
  const theme = useTheme();

  const handleClick = useCallback(() => {
    onClick(item);
  }, [item, onClick]);

  return (
    <Box
      borderTop={`5px solid ${
        selected ? theme.palette.primary.main : 'transparent'
      }`}
      width={72}
    >
      <StyledButton onClick={handleClick}>
        <Box display="flex" flexDirection="column" fontSize="44%">
          <Box pb={0.2}>{item.icon}</Box>
          <Typography variant="inherit" component="div">
            {item.value}
          </Typography>
        </Box>
      </StyledButton>
    </Box>
  );
};

export default MobileMenuButton;
