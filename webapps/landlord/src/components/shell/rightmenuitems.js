import {
  LuCoins,
  LuCrown,
  LuGlobe,
  LuMail,
  LuUser,
  LuUsers
} from 'react-icons/lu';

const rightMenuItems = [
  [
    {
      key: 'account',
      Icon: LuUser,
      labelId: 'Your account',
      pathname: '/settings/account',
      dataCy: 'accountNav'
    },
    {
      key: 'webserver',
      Icon: LuGlobe,
      labelId: 'Web server',
      pathname: '/settings/webserver',
      dataCy: 'webServerNav'
    }
  ],
  [
    {
      key: 'landlord',
      Icon: LuCrown,
      labelId: 'Landlord',
      pathname: '/settings/landlord',
      dataCy: 'landlordNav'
    },
    {
      key: 'billing',
      Icon: LuCoins,
      labelId: 'Billing',
      pathname: '/settings/billing',
      dataCy: 'billingNav'
    },
    {
      key: 'access',
      Icon: LuUsers,
      labelId: 'Access',
      pathname: '/settings/access',
      dataCy: 'accessNav'
    },
    {
      key: 'email',
      Icon: LuMail,
      labelId: 'Email service',
      pathname: '/settings/email',
      dataCy: 'emailNav'
    }
  ]
];

export default rightMenuItems;
