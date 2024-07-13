import React, { useContext } from 'react';
import { Card } from '../components/ui/card';
import Landlord from '../components/organization/LandlordForm';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../store';

import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import Welcome from '../components/Welcome';
import { withAuthentication } from '../components/Authentication';

function FirstAccess() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();

  if (store.organization.items.length) {
    router.push(`/${store.organization.selected.name}/dashboard`);
    return null;
  }

  return (
    <div
      className="mt-10 mx-4 text-center sm:text-left sm:container sm:w-[36rem]"
      data-cy="firstaccessPage"
    >
      <div className="py-5">
        <Welcome className="text-center sm:text-left" />
      </div>
      <div className="text-lg mb-4">
        {t('One more step, tell us who will rent the properties')}
      </div>
      <Card className="p-6">
        <Landlord firstAccess />
      </Card>
    </div>
  );
}

export default withAuthentication(observer(FirstAccess));
