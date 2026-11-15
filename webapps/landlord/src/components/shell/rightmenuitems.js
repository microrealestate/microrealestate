import {
  LuCoins,
  LuCrown,
  LuGlobe,
  LuMail,
  LuUser,
  LuUsers
} from 'react-icons/lu';

const rightMenuGroups = [
  {
    key: 'account',
    items: [
      {
        key: 'account',
        Icon: LuUser,
        labelId: 'My profile',
        pathname: '/settings/account',
        dataCy: 'accountNav'
      }
    ]
  },
  {
    key: 'settings',
    labelId: 'Organization settings',
    items: [
      {
        key: 'landlord',
        Icon: LuCrown,
        labelId: 'Landlord details',
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
        labelId: 'Team members',
        pathname: '/settings/access',
        dataCy: 'accessNav'
      }
    ]
  },
  {
    key: 'application',
    labelId: 'Application settings',
    withThemeSwitch: true,
    withAbout: true,
    items: [
      {
        key: 'webserver',
        Icon: LuGlobe,
        labelId: 'Web server',
        pathname: '/settings/webserver',
        dataCy: 'webServerNav'
      },
      {
        key: 'email',
        Icon: LuMail,
        labelId: 'Email service',
        pathname: '/settings/email',
        dataCy: 'emailNav'
      }
    ]
  }
];

export default rightMenuGroups;
