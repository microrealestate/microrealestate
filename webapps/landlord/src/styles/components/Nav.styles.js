import { drawerWidth } from '../styles.js';

import { makeStyles } from '@material-ui/core/styles';
const drawerOuterHeight = 330;
const drawerInnerHeight = 300;

export const useStyles = makeStyles((theme) => ({
  drawerOpen: {
    position: 'fixed',
    top: `calc(40vh - ${drawerOuterHeight / 2}px)`,
    left: 11,
    height: drawerOuterHeight,
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    border: 0,
    borderRadius: theme.shape.borderRadius,
    zIndex: theme.zIndex.appBar + 1,
    boxShadow: theme.shadows[3],
  },
  drawerClose: {
    position: 'fixed',
    top: `calc(40vh - ${drawerOuterHeight / 2}px)`,
    left: 11,
    height: drawerOuterHeight,
    width: theme.spacing(7) + 1,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    border: 0,
    borderRadius: theme.shape.borderRadius,
    zIndex: theme.zIndex.appBar + 1,
    boxShadow: theme.shadows[3],
  },
  list: {
    margin: 'auto 0',
    height: drawerInnerHeight,
  },
  itemSelected: {
    color: [theme.palette.info.contrastText, '!important'],
    backgroundColor: [theme.palette.primary.main, '!important'],
  },
  mobileItemSelected: {
    color: [theme.palette.primary.main, '!important'],
    backgroundColor: ['none', '!important'],
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
