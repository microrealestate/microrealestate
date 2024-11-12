import { createTheme } from '@material-ui/core/styles';

const backgroundColor = '#f3f7fd';
const whiteColor = '#FFFFFF';
const primaryColor = '#2563eb';
const successColor = '#16a34a';
const warningColor = '#f97316';
const defaultColor = '#020817';

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: primaryColor,
      contrastText: whiteColor
    },
    success: {
      main: successColor,
      contrastText: whiteColor
    },
    warning: {
      main: warningColor,
      contrastText: whiteColor
    },
    background: {
      paper: whiteColor,
      default: backgroundColor
    }
  },
  overrides: {
    MuiAppBar: {
      colorPrimary: {
        color: defaultColor,
        backgroundColor: whiteColor
      }
    },
    MuiInputAdornment: {
      root: {
        color: defaultColor
      }
    },
    MuiButton: {
      root: {
        color: defaultColor
      },
      containedPrimary: {
        color: whiteColor,
        '&.Mui-selected': {
          backgroundColor: primaryColor
        }
      }
    },
    MuiInput: {
      root: {
        color: defaultColor
      }
    },
    MuiStepIcon: {
      root: {
        '&$completed': {
          color: successColor
        }
      }
    },
    MuiTabs: {
      indicator: {
        backgroundColor: primaryColor
      }
    }
  }
});

export default theme;
