import { Box, CircularProgress } from '@material-ui/core';

const Loading = ({ height = '100%' }) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      height={height}
      data-cy="loading"
    >
      <CircularProgress />
    </Box>
  );
};

export default Loading;
