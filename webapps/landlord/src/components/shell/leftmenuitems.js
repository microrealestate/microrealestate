import { BsReceipt } from 'react-icons/bs';
import {
  LuCircleUser,
  LuKeyRound,
  LuLayoutDashboard,
  LuListTodo,
  LuWallet
} from 'react-icons/lu';
import { RiContractLine } from 'react-icons/ri';

const leftMenuItems = [
  {
    key: 'todo',
    labelId: 'To do',
    pathname: '/todo',
    Icon: LuListTodo,
    dataCy: 'todoNav'
  },
  {
    key: 'dashboard',
    labelId: 'Dashboard',
    pathname: '/dashboard',
    Icon: LuLayoutDashboard,
    dataCy: 'dashboardNav'
  },
  {
    key: 'rents',
    labelId: 'Rents',
    pathname: '/rents',
    subPathnames: ['/payment/[tenantId]/[...param]'],
    Icon: BsReceipt,
    dataCy: 'rentsNav'
  },
  {
    key: 'tenants',
    labelId: 'Tenants',
    pathname: '/tenants',
    Icon: LuCircleUser,
    dataCy: 'tenantsNav'
  },
  {
    key: 'properties',
    labelId: 'Properties',
    pathname: '/properties',
    Icon: LuKeyRound,
    dataCy: 'propertiesNav'
  },
  {
    key: 'contracts',
    labelId: 'Contracts',
    pathname: '/settings/contracts',
    Icon: RiContractLine,
    dataCy: 'contractsNav'
  },
  {
    key: 'rentalactivity',
    labelId: 'Rental activity',
    pathname: '/rentalactivity/[year]',
    Icon: LuWallet,
    dataCy: 'rentalActivityNav'
  }
];

export default leftMenuItems;
