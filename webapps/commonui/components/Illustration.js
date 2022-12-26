import { Box } from '@material-ui/core';
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
      alignItems="center"
      width={width}
      height={height}
      color="text.secondary"
      fontSize="caption.fontSize"
    >
      <Box position="relative" width={width} height={height}>
        <Image src={src} layout="fill" alt={alt} />
      </Box>
      {!!label && <Box pt={2}>{label}</Box>}
    </Box>
  );
}
