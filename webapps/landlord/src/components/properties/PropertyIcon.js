import {
  BuildingIcon,
  HomeIcon,
  MailboxIcon,
  MountainIcon,
  ParkingSquareIcon,
  StoreIcon
} from 'lucide-react';

export default function PropertyIcon({ type }) {
  let TypeIcon = MountainIcon;
  switch (type) {
    case 'store':
      TypeIcon = StoreIcon;
      break;
    case 'apartment':
      TypeIcon = HomeIcon;
      break;
    case 'building':
    case 'room':
    case 'office':
      TypeIcon = BuildingIcon;
      break;
    case 'garage':
    case 'parking':
      TypeIcon = ParkingSquareIcon;
      break;
    case 'letterbox':
      TypeIcon = MailboxIcon;
      break;
  }

  return <TypeIcon />;
}
