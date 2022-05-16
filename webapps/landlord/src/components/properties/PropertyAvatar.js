import { Avatar, Box } from '@material-ui/core';

import { memo } from 'react';
import PropertyIcon from './PropertyIcon';

const PropertyAvatar = ({ type, className }) => {
  return (
    <Box mr={1}>
      <Avatar variant="rounded" className={className}>
        <PropertyIcon type={type} />
      </Avatar>
    </Box>
  );
};

export default memo(PropertyAvatar);
