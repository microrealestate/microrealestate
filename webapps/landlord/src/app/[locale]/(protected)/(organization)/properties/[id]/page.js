'use client';

import AddressMap from '@microrealestate/commonui/components/AddressMap';
import { Card } from '@microrealestate/commonui/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@microrealestate/commonui/components/ui/tabs';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LuArrowLeft, LuHistory, LuKeyRound, LuTrash } from 'react-icons/lu';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import NumberFormat from '@/components/NumberFormat';
import Page from '@/components/Page';
import PropertyForm from '@/components/properties/PropertyForm';
import ShortcutButton from '@/components/ShortcutButton';
import useFillStore from '@/hooks/useFillStore';
import { useRouter } from '@/i18n/navigation';
import { useNav } from '@/providers/NavProvider';
import { useStore } from '@/providers/StoreProvider';

function PropertyOverviewCard() {
  const t = useTranslations('common');
  const store = useStore();

  return (
    <DashboardCard
      Icon={LuKeyRound}
      title={t('Property')}
      renderContent={() => (
        <div className="text-base space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {store.property.selected.name}
            </span>
            <NumberFormat value={store.property.selected.price} />
          </div>
          <AddressMap address={store.property.selected.address} />
        </div>
      )}
    />
  );
}

function OccupancyHistoryCard() {
  const t = useTranslations('common');
  const store = useStore();

  return store.property.selected?.occupancyHistory?.length ? (
    <DashboardCard
      Icon={LuHistory}
      title={t('Previous tenants')}
      renderContent={() =>
        store.property.selected.occupancyHistory.map((occupant) => {
          const occupationDates = t('{beginDate} to {endDate}', {
            beginDate: moment(occupant.beginDate).format('ll'),
            endDate: moment(occupant.endDate).format('ll')
          });
          return (
            <div key={occupant.id} className="mt-2">
              <div className="text-base">{occupant.name}</div>
              <div className="text-xs text-muted-foreground">
                {occupationDates}
              </div>
            </div>
          );
        })
      }
    />
  ) : null;
}

async function fetchData(store, params) {
  const results = await store.property.fetchOne(params.id);
  store.property.setSelected(
    store.property.items.find(({ _id }) => _id === params.id)
  );
  return results;
}

function Property() {
  const t = useTranslations('common');
  const store = useStore();
  const router = useRouter();
  const params = useParams();
  const { goBack } = useNav();
  const [openConfirmDeletePropertyDialog, setOpenConfirmDeletePropertyDialog] =
    useState(false);
  const [fetching] = useFillStore(fetchData, [params]);

  const handleBack = () => {
    goBack();
  };

  const onConfirmDeleteProperty = () => {
    setOpenConfirmDeletePropertyDialog(true);
  };

  const onDeleteProperty = async () => {
    const { status } = await store.property.delete([
      store.property.selected._id
    ]);
    if (status !== 200) {
      switch (status) {
        case 422:
          return toast.error(t('Property cannot be deleted'));
        case 404:
          return toast.error(t('Property does not exist'));
        default:
          return toast.error(t('Something went wrong'));
      }
    }
    goBack();
  };

  const onSubmit = async (propertyPart) => {
    const originalProperty = toJS(store.property.selected);
    const property = {
      ...originalProperty,
      ...propertyPart,
      price: propertyPart.rent,
      stepperMode: false
    };

    if (property._id) {
      const { status, data } = await store.property.update(property);
      if (status !== 200) {
        switch (status) {
          case 422:
            return toast.error(t('Property name is missing'));
          default:
            return toast.error(t('Something went wrong'));
        }
      }
      store.property.setSelected(data);
      if (originalProperty.stepperMode) {
        goBack();
      }
    } else {
      const { status, data } = await store.property.create(property);
      if (status !== 200) {
        switch (status) {
          case 422:
            return toast.error(t('Property name is missing'));
          case 409:
            return toast.error(t('The property already exists'));
          default:
            return toast.error(t('Something went wrong'));
        }
      }
      store.property.setSelected(data);
      await router.push(`/properties/${data._id}`);
    }
  };

  return (
    <Page
      loading={fetching}
      ActionBar={
        <div className="grid grid-cols-5 gap-1.5 md:gap-4">
          <ShortcutButton
            label={t('Back')}
            Icon={LuArrowLeft}
            onClick={handleBack}
          />
          <ShortcutButton
            label={t('Delete')}
            Icon={LuTrash}
            onClick={onConfirmDeleteProperty}
            className="col-start-2 col-end-2"
            dataCy="removeResourceButton"
          />
        </div>
      }
      dataCy="propertyPage"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Tabs defaultValue="property" className="md:col-span-2">
          <TabsList className="flex items-start justify-start h-auto w-auto overflow-x-auto">
            <TabsTrigger value="property" className="w-1/2">
              {t('Property')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="property">
            <Card className="p-6">
              <PropertyForm onSubmit={onSubmit} />
            </Card>
          </TabsContent>
        </Tabs>
        <div className="hidden md:grid grid-cols-1 gap-4 h-fit sticky top-20">
          <PropertyOverviewCard />
          <OccupancyHistoryCard />
        </div>
      </div>

      <ConfirmDialog
        title={t('Are you sure to definitely remove this property?')}
        subTitle={store.property.selected.name}
        open={openConfirmDeletePropertyDialog}
        setOpen={setOpenConfirmDeletePropertyDialog}
        onConfirm={onDeleteProperty}
      />
    </Page>
  );
}

const PropertyPage = observer(function () {
  return <Property />;
});
export default PropertyPage;
