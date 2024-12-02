import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import WarrantyIcon from './WarrantyIcon';

const WarrantyAvatar = ({ type }) => {
  return (
    <Avatar>
      <WarrantyIcon type={type} />
    </Avatar>
  );
};

export default WarrantyAvatar;