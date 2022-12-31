import { Box, Divider, Typography } from '@material-ui/core';

import { SwitchField } from './SwitchField';

export function Section({
  label,
  description,
  visible = true,
  withSwitch = false,
  switchName,
  children,
}) {
  return (
    <Box pb={4}>
      {visible ? (
        <>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h5">{label}</Typography>
            {withSwitch ? (
              <SwitchField name={switchName} color="primary" />
            ) : null}
          </Box>

          <Box fontSize="body2.fontSize" color="text.secondary">
            {!!description && description}
          </Box>

          <Box pt={1} pb={2}>
            <Divider />
          </Box>
          {children}
        </>
      ) : (
        children
      )}
    </Box>
  );
}
