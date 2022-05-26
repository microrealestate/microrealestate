import {
  Box,
  Button,
  Typography,
  useTheme,
  withStyles,
} from '@material-ui/core';

import { hexToRgb } from '../styles/styles';
import { useCallback } from 'react';

const StyledButton = withStyles(() => ({
  root: {
    width: '100%',
    fontSize: 9,
  },
}))(Button);

const StyleMenuButton = withStyles((theme) => ({
  root: {
    color: 'rgba(' + hexToRgb(theme.palette.info.contrastText) + ', 0.8)',
    padding: 0,
    margin: 0,
    paddingTop: 2,
    borderRadius: 0,
  },
}))(StyledButton);

function MobileMenuButton({ item, selected, onClick }) {
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
      height={72}
    >
      <StyleMenuButton onClick={handleClick}>
        <Box display="flex" flexDirection="column">
          <Box pb={0.2}>{item.icon}</Box>
          <Typography variant="inherit">{item.value}</Typography>
        </Box>
      </StyleMenuButton>
    </Box>
  );
}

export default MobileMenuButton;

export function MobileButton({ label, Icon, onClick, ...props }) {
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  return (
    <StyledButton {...props} size="small" onClick={handleClick}>
      <Box display="flex" flexDirection="column" fontSize={9}>
        <Box>
          <Icon fontSize="small" />
        </Box>
        <Typography variant="inherit">{label}</Typography>
      </Box>
    </StyledButton>
  );
}
