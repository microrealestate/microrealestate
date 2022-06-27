import {
  grayColor,
  hexToRgb,
  primaryColor,
  successColor,
  warningColor,
  whiteColor,
} from './styles';

import { createTheme } from '@material-ui/core/styles';

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      light: primaryColor[0],
      main: primaryColor[1],
      dark: primaryColor[2],
      contrastText: whiteColor,
    },
    success: {
      light: successColor[0],
      main: successColor[1],
      dark: successColor[2],
      contrastText: 'rgba(0, 0, 0, 0.87)',
    },
    warning: {
      light: warningColor[0],
      main: warningColor[1],
      dark: warningColor[2],
      contrastText: 'rgba(0, 0, 0, 0.87)',
    },
    backgroundColor: grayColor[10],
  },
  overrides: {
    MuiInputAdornment: {
      root: {
        color: grayColor[7],
      },
    },
    MuiButton: {
      root: {
        color: grayColor[7],
      },
      containedPrimary: {
        color: whiteColor,
        '&.Mui-selected': {
          backgroundColor: '#7a1e89',
        },
      },
    },
    MuiInput: {
      root: {
        color: grayColor[7],
      },
    },
    MuiAppBar: {
      colorPrimary: {
        color: grayColor[2],
        backgroundColor: whiteColor,
      },
    },
    MuiDrawer: {
      paper: {
        overflowX: 'hidden',
      },
    },
    MuiStepIcon: {
      root: {
        '&$completed': {
          color: successColor[1],
        },
      },
    },
    MuiTableRow: {
      root: {
        '&$selected, &$selected$hover': {
          backgroundColor: 'rgba(' + hexToRgb(successColor[1]) + ', 0.08)',
        },
      },
    },
  },
});

export default theme;
