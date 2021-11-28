import { Box, CircularProgress } from '@material-ui/core';

const Loading = () => {
  return (
    <Box marginLeft="50%" marginTop={20} data-cy="loading">
      <CircularProgress />
    </Box>
  );
};

export default Loading;
