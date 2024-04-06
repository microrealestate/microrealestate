import { Children, memo } from 'react';
import { Box } from '@material-ui/core';

export const CardRow = memo(function CardRow({ children, ...props }) {
  return (
    <Box
      display="flex"
      alignItems="center"
      {...props}
      color="text.secondary"
      fontSize="body1.fontSize"
    >
      {Children.toArray(children).map((child, index) => (
        <Box key={index} flexGrow={index === 0 ? 1 : 0}>
          {child}
        </Box>
      ))}
    </Box>
  );
});
