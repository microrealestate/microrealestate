import { AlertTitle, Alert as MuiAlert } from '@material-ui/lab';
import { Box, withStyles } from '@material-ui/core';

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

function RawAlert({ title, children, ...props }) {
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

function Alert({ title, severity, elevation, children, ...props }) {
  return elevation ? (
    <Box {...props}>
      <RawAlert title={title} severity={severity} elevation={elevation}>
        {children}
      </RawAlert>
    </Box>
  ) : (
    <Box
      border={1}
      borderColor="divider"
      borderRadius="borderRadius"
      {...props}
    >
      <RawAlert title={title} severity={severity}>
        {children}
      </RawAlert>
    </Box>
  );
}

export default Alert;
