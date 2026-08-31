import { cn } from '@microrealestate/commonui/utils';
import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { LuCircleStop, LuCircleUser, LuKeyRound } from 'react-icons/lu';
import { RiContractLine } from 'react-icons/ri';
import { TbCashRegister } from 'react-icons/tb';
import { useMediaQuery } from 'usehooks-ts';
import useResourceActions from '@/hooks/useResourceActions';
import { useStore } from '@/providers/StoreProvider';
import ShortcutButton from '../ShortcutButton';

interface ShortcutsProps {
  className?: string;
}

function Shortcuts({ className }: ShortcutsProps) {
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
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <>
      <div
        className={cn(
          'fixed bottom-0 grid grid-cols-5 gap-1.5 left-0 w-full z-50 bg-card border-t shadow-2xl p-1 pt-2',
          'md:relative md:z-auto md:gap-4 md:border-none md:p-0 md:shadow-none md:bg-transparent',
          className
        )}
      >
        <ShortcutButton
          Icon={TbCashRegister}
          label={isDesktop ? t('Cash a rent') : t('Cash in')}
          disabled={!store.organization.selected}
          onClick={handlePayment}
          dataCy="shortcutSettleRent"
        />

        <ShortcutButton
          Icon={LuCircleStop}
          label={isDesktop ? t('Terminate a lease') : t('Terminate')}
          onClick={handleTerminateLease}
          disabled={!store.organization.selected}
          dataCy="shortcutTerminateLease"
        />

        <ShortcutButton
          Icon={LuKeyRound}
          label={isDesktop ? t('Add a property') : t('Add')}
          onClick={handleAddProperty}
          dataCy="shortcutAddProperty"
        />

        <ShortcutButton
          Icon={LuCircleUser}
          label={isDesktop ? t('Add a tenant') : t('Add')}
          onClick={handleAddTenant}
          dataCy="shortcutAddTenant"
        />

        <ShortcutButton
          Icon={RiContractLine}
          label={isDesktop ? t('Create a contract') : t('Create')}
          onClick={handleCreateContract}
          dataCy="shortcutCreateContract"
        />
      </div>
      <ResourceDialogs />
    </>
  );
}

export default observer(Shortcuts);
