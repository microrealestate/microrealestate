import { Avatar, makeStyles } from '@material-ui/core';

import { memo } from 'react';
import PropertyIcon from './PropertyIcon';

const useStyles = makeStyles((theme) => ({
  vacant: {
    backgroundColor: theme.palette.success.main,
  },
}));

const PropertyAvatar = ({ type, status }) => {
  const classes = useStyles();

  return (
    <Avatar className={status === 'vacant' ? classes.vacant : null}>
      <PropertyIcon type={type} />
    </Avatar>
  );
};

export default memo(PropertyAvatar);
