import { cn } from '@microrealestate/commonui/utils';
import {
  LuBedSingle,
  LuBuilding,
  LuHouse,
  LuMailbox,
  LuMountain,
  LuSquareParking,
  LuStore,
  LuWarehouse
} from 'react-icons/lu';
import { PiOfficeChair } from 'react-icons/pi';

export default function PropertyIcon({ type, className }) {
  let TypeIcon = LuMountain;
  switch (type) {
    case 'store':
      TypeIcon = LuStore;
      break;
    case 'apartment':
      TypeIcon = LuHouse;
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
      TypeIcon = LuSquareParking;
      break;
    case 'letterbox':
      TypeIcon = LuMailbox;
      break;
  }

  return <TypeIcon className={cn('size-6', className)} />;
}
