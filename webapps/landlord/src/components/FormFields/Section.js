import { Box, Divider, Typography } from '@material-ui/core';

export default function Section({
  label,
  description,
  visible = true,
  children,
}) {
  return (
    <Box pb={4}>
      {visible ? (
        <>
          <Typography variant="h5">{label}</Typography>
          <Box pt={1} pb={2}>
            <Divider />
          </Box>
          {!!description && (
            <Typography variant="body1">{description}</Typography>
          )}
          {children}
        </>
      ) : (
        children
      )}
    </Box>
  );
}
