import { Box, Collapse } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';

const RequestError = ({ error }) => (
  <Box pb={error ? 2 : 0} pt={error ? 2 : 0}>
    <Collapse in={!!error}>
      <Alert severity="error">{error}</Alert>
    </Collapse>
  </Box>
);

export default RequestError;
