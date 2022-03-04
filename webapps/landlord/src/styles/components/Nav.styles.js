import { defaultFont, drawerWidth, hexToRgb, whiteColor } from '../styles.js';

import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles((theme) => ({
  drawerOpen: {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    width: theme.spacing(7) + 1,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  list: {
    marginTop: 56,
  },
  itemSelected: {
    backgroundColor: [theme.palette.primary.main, '!important'],
  },
  mobileItemSelected: {
    color: [theme.palette.primary.main, '!important'],
    backgroundColor: ['none', '!important'],
  },
  itemIcon: {
    color: ['rgba(' + hexToRgb(whiteColor) + ', 0.8)', '!important'],
  },
  itemText: {
    ...defaultFont,
    margin: 0,
    lineHeight: 30,
    fontSize: 14,
    color: whiteColor,
  },
  itemTextOpen: {
    opacity: 100,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  itemTextClose: {
    opacity: 0,
    transition: theme.transitions.create('opacity', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
}));
