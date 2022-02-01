import { Toolbar } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

const FormatToolbar = withStyles((theme) => ({
  root: {
    padding: 0,
    margin: 0,
    minHeight: 0,
    backgroundColor: theme.palette.background.paper,
  },
}))(Toolbar);

export default FormatToolbar;
