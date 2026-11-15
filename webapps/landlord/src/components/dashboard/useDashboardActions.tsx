import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { LuCircleStop, LuCircleUser, LuKeyRound } from 'react-icons/lu';
import { RiContractLine } from 'react-icons/ri';
import { TbCashRegister } from 'react-icons/tb';
import useResourceActions from '@/hooks/useResourceActions';
import { useStore } from '@/providers/StoreProvider';
import type { PageAction } from '../PageActions';

export default function useDashboardActions(): {
  actions: PageAction[];
  dialogs: ReactNode;
} {
  const store = useStore();
  const t = useTranslations('common');
  const {
    ResourceDialogs,
    handleAddProperty,
    handleAddTenant,
    handleCreateContract,
    handlePayment,
    handleTerminateLease
  } = useResourceActions();
  const noOrganization = !store.organization.selected;

  const actions: PageAction[] = [
    {
      id: 'settleRent',
      label: t('Collect rent'),
      icon: TbCashRegister,
      onClick: handlePayment,
      disabled: noOrganization,
      primary: true,
      dataCy: 'shortcutSettleRent'
    },
    {
      id: 'addTenant',
      label: t('New tenant'),
      icon: LuCircleUser,
      onClick: handleAddTenant,
      dataCy: 'shortcutAddTenant'
    },
    {
      id: 'addProperty',
      label: t('New property'),
      icon: LuKeyRound,
      onClick: handleAddProperty,
      dataCy: 'shortcutAddProperty'
    },
    {
      id: 'terminateLease',
      label: t('Terminate a lease'),
      icon: LuCircleStop,
      onClick: handleTerminateLease,
      disabled: noOrganization,
      dataCy: 'shortcutTerminateLease'
    },
    {
      id: 'createContract',
      label: t('New contract'),
      icon: RiContractLine,
      onClick: handleCreateContract,
      dataCy: 'shortcutCreateContract'
    }
  ];

  return { actions, dialogs: <ResourceDialogs /> };
}
