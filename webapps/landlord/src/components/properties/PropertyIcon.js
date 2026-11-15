import { cn } from '@microrealestate/commonui/utils';
import {
  LuBuilding,
  LuDoorOpen,
  LuHouse,
  LuLandPlot,
  LuLayers,
  LuMailbox,
  LuMountain,
  LuSquareParking,
  LuStore,
  LuWarehouse
} from 'react-icons/lu';
import { PiOfficeChair } from 'react-icons/pi';
import { TbStairsDown } from 'react-icons/tb';

export default function PropertyIcon({ type, className, ...props }) {
  let TypeIcon = LuMountain;
  switch (type) {
    case 'store':
      TypeIcon = LuStore;
      break;
    case 'apartment':
      TypeIcon = LuHouse;
      break;
    case 'room':
      TypeIcon = LuDoorOpen;
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
    case 'floor':
      TypeIcon = LuLayers;
      break;
    case 'cellar':
      TypeIcon = TbStairsDown;
      break;
    case 'estate':
      TypeIcon = LuLandPlot;
      break;
  }

  return <TypeIcon className={cn('size-6', className)} {...props} />;
}
