import {
  BedSingleIcon,
  BuildingIcon,
  HomeIcon,
  MailboxIcon,
  MountainIcon,
  ParkingSquareIcon,
  StoreIcon,
  WarehouseIcon
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
    case 'room':
      TypeIcon = BedSingleIcon;
      break;
    case 'building':
    case 'office':
      TypeIcon = BuildingIcon;
      break;
    case 'garage':
      TypeIcon = WarehouseIcon;
      break;
    case 'parking':
      TypeIcon = ParkingSquareIcon;
      break;
    case 'letterbox':
      TypeIcon = MailboxIcon;
      break;
  }

  return <TypeIcon />;
}
