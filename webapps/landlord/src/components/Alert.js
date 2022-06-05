import { AlertTitle, Alert as MuiAlert } from '@material-ui/lab';
import { withStyles } from '@material-ui/core';

const AlertWithContent = withStyles({
  root: {
    '& ul': {
      margin: 0,
    },
  },
})(MuiAlert);

const InlineAlert = withStyles((theme) => ({
  root: {
    padding: '0 6px',
    '& .MuiAlert-icon': {
      marginRight: 6,
    },
    '& .MuiAlert-message': {
      fontSize: theme.typography.caption.fontSize,
    },
  },
}))(MuiAlert);

function Alert({ title, children, ...props }) {
  return children ? (
    <AlertWithContent severity="warning" {...props}>
      <AlertTitle>{title}</AlertTitle>
      {children}
    </AlertWithContent>
  ) : (
    <InlineAlert severity="warning" {...props}>
      {title}
    </InlineAlert>
  );
}

export default Alert;
