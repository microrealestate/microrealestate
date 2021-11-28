import ApartmentIcon from '@material-ui/icons/ApartmentOutlined';
import EmojiTransportationOutlinedIcon from '@material-ui/icons/EmojiTransportationOutlined';
import HomeIcon from '@material-ui/icons/HomeOutlined';
import MarkunreadMailboxIcon from '@material-ui/icons/MarkunreadMailboxOutlined';
import { memo } from 'react';
import ParkingIcon from '@material-ui/icons/LocalParkingOutlined';
import StoreIcon from '@material-ui/icons/StorefrontOutlined';
import TerrainIcon from '@material-ui/icons/Terrain';

const PropertyIcon = ({ type, ...props }) => {
  let TypeIcon = TerrainIcon;
  switch (type) {
    case 'store':
      TypeIcon = StoreIcon;
      break;
    case 'building':
      TypeIcon = ApartmentIcon;
      break;
    case 'apartment':
      TypeIcon = HomeIcon;
      break;
    case 'room':
      TypeIcon = ApartmentIcon;
      break;
    case 'office':
      TypeIcon = ApartmentIcon;
      break;
    case 'garage':
      TypeIcon = EmojiTransportationOutlinedIcon;
      break;
    case 'parking':
      TypeIcon = ParkingIcon;
      break;
    case 'letterbox':
      TypeIcon = MarkunreadMailboxIcon;
      break;
  }

  return <TypeIcon {...props} />;
};

export default memo(PropertyIcon);
