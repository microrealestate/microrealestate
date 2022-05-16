import { Avatar, Box } from '@material-ui/core';
import { memo, useMemo } from 'react';

const TenantAvatar = memo(function TenantAvatar({ tenant, className }) {
  const avatar = useMemo(
    () =>
      tenant.name
        .split(' ')
        .reduce((acc, w, index) => {
          if (index < 2) {
            acc.push(w);
          }
          return acc;
        }, [])
        .filter((n) => !!n)
        .map((n) => n[0])
        .join(''),
    [tenant.name]
  );

  return (
    <Box mr={1}>
      <Avatar variant="rounded" className={className}>
        {avatar}
      </Avatar>
    </Box>
  );
});

export default TenantAvatar;
