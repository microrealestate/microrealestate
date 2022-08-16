import { Box, Typography } from '@material-ui/core';

import Image from 'next/image';

export function Illustration({
  src,
  label,
  alt,
  width = '100%',
  height = 200,
}) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      height="100%"
      width={width}
    >
      <Box height={height} width={width} position="relative">
        <Image src={src} layout="fill" alt={alt} />
      </Box>
      {!!label && (
        <Box pt={1} color="text.disabled">
          <Typography align="center" variant="caption" component="p">
            {label}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
