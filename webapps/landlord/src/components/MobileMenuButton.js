import {
  Box,
  Button,
  Typography,
  useTheme,
  withStyles,
} from '@material-ui/core';
import { forwardRef, useCallback } from 'react';

import { hexToRgb } from '../styles/styles';
import useTranslation from 'next-translate/useTranslation';

const StyledButton = withStyles(() => ({
  root: {
    fontSize: 9,
  },
}))(Button);

const StyledMenuButton = withStyles((theme) => ({
  root: {
    color: 'rgba(' + hexToRgb(theme.palette.info.contrastText) + ', 0.8)',
    fontSize: 9,
    padding: 0,
    margin: 0,
    paddingTop: 2,
    borderRadius: 0,
  },
}))(Button);

function MobileMenuButton({ labelId, Icon, selected, item, onClick }) {
  const theme = useTheme();
  const { t } = useTranslation('common');

  const handleClick = useCallback(() => {
    onClick(item);
  }, [item, onClick]);

  return (
    <Box
      borderTop={`5px solid ${
        selected ? theme.palette.primary.main : 'transparent'
      }`}
    >
      <StyledMenuButton onClick={handleClick}>
        <Box display="flex" flexDirection="column">
          <Box>
            <Icon fontSize="small" />
          </Box>
          <Typography variant="inherit">{t(labelId)}</Typography>
        </Box>
      </StyledMenuButton>
    </Box>
  );
}

export default MobileMenuButton;

export const MobileButton = forwardRef(function MobileButton(
  { label, Icon, onClick, ...props },
  ref
) {
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  return (
    <StyledButton ref={ref} {...props} size="small" onClick={handleClick}>
      <Box display="flex" flexDirection="column">
        <Box>
          <Icon fontSize="small" />
        </Box>
        <Typography variant="inherit">{label}</Typography>
      </Box>
    </StyledButton>
  );
});
