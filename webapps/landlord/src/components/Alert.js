import MuiAlert from '@material-ui/lab/Alert';
import { withStyles } from '@material-ui/core';

const StyledAlert = withStyles((theme) => ({
  root: {
    padding: '0 6px',
    '& .MuiAlert-icon': {
      fontSize: 18,
      marginRight: 6,
      padding: '4px 0',
    },
    '& .MuiAlert-message': {
      fontSize: theme.typography.caption.fontSize,
      padding: '4px 0',
    },
  },
}))(MuiAlert);

function Alert({ label, ...props }) {
  return (
    <StyledAlert severity="warning" variant="filled" {...props}>
      {label}
    </StyledAlert>
  );
}

export default Alert;
