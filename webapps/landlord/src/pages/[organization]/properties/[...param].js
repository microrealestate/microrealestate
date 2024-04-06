import {
  ArrowLeftIcon,
  HistoryIcon,
  KeyRoundIcon,
  TrashIcon
} from 'lucide-react';
import { Tab, Tabs } from '@material-ui/core';
import { TabPanel, useTabChangeHelper } from '../../../components/Tabs';
import { useCallback, useContext } from 'react';
import { Card } from '../../../components/ui/card';
import { DashboardCard } from '../../../components/dashboard/DashboardCard';
import Map from '../../../components/Map';
import moment from 'moment';
import NumberFormat from '../../../components/NumberFormat';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import PropertyForm from '../../../components/properties/PropertyForm';
import ShortcutButton from '../../../components/ShortcutButton';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import { toJS } from 'mobx';
import useConfirmDialog from '../../../components/ConfirmDialog';
import useFillStore from '../../../hooks/useFillStore';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

function PropertyOverviewCard() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  return (
    <DashboardCard
      Icon={KeyRoundIcon}
      title={t('Property')}
      renderContent={() => (
        <div className="text-base">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {store.property.selected.name}
            </span>
            <NumberFormat value={store.property.selected.price} />
          </div>
          <Map address={store.property.selected.address} />
        </div>
      )}
    />
  );
}

function OccupancyHistoryCard() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  return (
    <DashboardCard
      Icon={HistoryIcon}
      title={t('Previous tenants')}
      renderContent={() => (
        <div className="flex flex-col gap-2 text-xs">
          {store.property.selected?.occupancyHistory?.length ? (
            store.property.selected.occupancyHistory.map((occupant) => {
              const occupationDates = t('{{beginDate}} to {{endDate}}', {
                beginDate: moment(occupant.beginDate, 'DD/MM/YYYY').format(
                  'll'
                ),
                endDate: moment(occupant.endDate, 'DD/MM/YYYY').format('ll')
              });
              return (
                <div key={occupant.id} className="flex justify-between">
                  <span className="text-muted-foreground">{occupant.name}</span>
                  <span>{occupationDates}</span>
                </div>
              );
            })
          ) : (
            <span className="text-muted-foreground">
              {t('Property not rented so far')}
            </span>
          )}
        </div>
      )}
    />
  );
}

async function fetchData(store, router) {
  const {
    query: {
      param: [propertyId]
    }
  } = router;
  const results = await store.property.fetchOne(propertyId);
  store.property.setSelected(
    store.property.items.find(({ _id }) => _id === propertyId)
  );
  return results;
}

function Property() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const { handleTabChange, tabSelectedIndex } = useTabChangeHelper();
  const [ConfirmDialog, setOpenConfirmDeleteProperty] = useConfirmDialog();
  const [fetching] = useFillStore(fetchData, [router]);

  const {
    query: {
      param: [, , backPath]
    }
  } = router;

  const handleBack = useCallback(() => {
    router.push(backPath);
  }, [router, backPath]);

  const onConfirmDeleteProperty = useCallback(() => {
    setOpenConfirmDeleteProperty(true);
  }, [setOpenConfirmDeleteProperty]);

  const onDeleteProperty = useCallback(async () => {
    const { status } = await store.property.delete([
      store.property.selected._id
    ]);
    if (status !== 200) {
      switch (status) {
        case 422:
          return toast.error(t('Property cannot be deleted'));
        case 404:
          return toast.error(t('Property does not exist'));
        case 403:
          return toast.error(t('You are not allowed to delete the Property'));
        default:
          return toast.error(t('Something went wrong'));
      }
    }

    await router.push(backPath);
  }, [store, router, backPath, t]);

  const onSubmit = useCallback(
    async (propertyPart) => {
      let property = {
        ...toJS(store.property.selected),
        ...propertyPart,
        price: propertyPart.rent
      };

      if (property._id) {
        const { status, data } = await store.property.update(property);
        if (status !== 200) {
          switch (status) {
            case 422:
              return toast.error(t('Property name is missing'));
            case 403:
              return toast.error(
                t('You are not allowed to update the property')
              );
            default:
              return toast.error(t('Something went wrong'));
          }
        }
        store.property.setSelected(data);
      } else {
        const { status, data } = await store.property.create(property);
        if (status !== 200) {
          switch (status) {
            case 422:
              return toast.error(t('Property name is missing'));
            case 403:
              return toast.error(t('You are not allowed to add a property'));
            case 409:
              return toast.error(t('The property already exists'));
            default:
              return toast.error(t('Something went wrong'));
          }
        }
        store.property.setSelected(data);
        await router.push(
          `/${store.organization.selected.name}/properties/${data._id}`
        );
      }
    },
    [store, t, router]
  );

  return (
    <Page
      loading={fetching}
      ActionBar={
        <div className="grid grid-cols-5 gap-1.5 md:gap-4">
          <ShortcutButton
            label={t('Back')}
            Icon={ArrowLeftIcon}
            onClick={handleBack}
          />
          <ShortcutButton
            label={t('Delete')}
            Icon={TrashIcon}
            onClick={onConfirmDeleteProperty}
            className="col-start-2 col-end-2"
          />
        </div>
      }
    >
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <Tabs
              variant="scrollable"
              value={tabSelectedIndex}
              onChange={handleTabChange}
              aria-label="Property tabs"
            >
              <Tab label={t('Property')} wrapped />
            </Tabs>
            <TabPanel value={tabSelectedIndex} index={0}>
              <PropertyForm onSubmit={onSubmit} />
            </TabPanel>
          </Card>

          <div className="hidden md:grid grid-cols-1 gap-4 h-fit">
            <PropertyOverviewCard />
            <OccupancyHistoryCard />
          </div>
        </div>

        <ConfirmDialog
          title={t('Are you sure to definitely remove this property?')}
          subTitle={store.property.selected.name}
          onConfirm={onDeleteProperty}
        />
      </>
    </Page>
  );
}

export default withAuthentication(observer(Property));
