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
    <>
      <Box position="relative" align="center" width={width} height={height}>
        <Image src={src} layout="fill" alt={alt} />
      </Box>
      {!!label && (
        <Box pt={1} color="text.disabled">
          <Typography align="center" variant="caption" component="p">
            {label}
          </Typography>
        </Box>
      )}
    </>
  );
}
