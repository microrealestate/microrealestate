import Box from '@material-ui/core/Box';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useTheme } from '@material-ui/core';

function LoadingAnimation({ height }) {
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
}

function Loading({ height = '100%', fullScreen = false }) {
  const theme = useTheme();
  return fullScreen ? (
    <Box
      position="fixed"
      top={0}
      left={0}
      width="100vw"
      height="100vh"
      zIndex={theme.zIndex.appBar}
    >
      <LoadingAnimation height={height} />
    </Box>
  ) : (
    <LoadingAnimation height={height} />
  );
}

export default Loading;
