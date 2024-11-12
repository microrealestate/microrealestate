import {
  LuBedSingle,
  LuBuilding,
  LuHome,
  LuMailbox,
  LuMountain,
  LuParkingSquare,
  LuStore,
  LuWarehouse
} from 'react-icons/lu';

import { PiOfficeChair } from 'react-icons/pi';

export default function PropertyIcon({ type }) {
  let TypeIcon = LuMountain;
  switch (type) {
    case 'store':
      TypeIcon = LuStore;
      break;
    case 'apartment':
      TypeIcon = LuHome;
      break;
    case 'room':
      TypeIcon = LuBedSingle;
      break;
    case 'building':
      TypeIcon = LuBuilding;
      break;
    case 'office':
      TypeIcon = PiOfficeChair;
      break;
    case 'garage':
      TypeIcon = LuWarehouse;
      break;
    case 'parking':
      TypeIcon = LuParkingSquare;
      break;
    case 'letterbox':
      TypeIcon = LuMailbox;
      break;
  }

  return <TypeIcon className="size-6" />;
}
