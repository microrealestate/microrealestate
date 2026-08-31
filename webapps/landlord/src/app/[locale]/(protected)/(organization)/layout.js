'use client';

import Loading from '@microrealestate/commonui/components/ui/Loading';
import { observer } from 'mobx-react-lite';
import useOrganization from '@/hooks/useOrganization';
import { useStore } from '@/providers/StoreProvider';

function OrganizationLayout({ children }) {
  const store = useStore();
  const { isLoading } = useOrganization();

  if (isLoading) return <Loading fullScreen />;

  if (!store.user.signedIn) return null;

  return <>{children}</>;
}

export default observer(OrganizationLayout);
