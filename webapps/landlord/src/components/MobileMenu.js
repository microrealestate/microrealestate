import { Box, withStyles } from '@material-ui/core';

import { hexToRgb } from '../styles/styles';

const MobileMenu = withStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.common.black,
    color: 'rgba(' + hexToRgb(theme.palette.info.contrastText) + ', 0.8)',
    zIndex: theme.zIndex.appBar + 1,
  },
}))(Box);

export default MobileMenu;
