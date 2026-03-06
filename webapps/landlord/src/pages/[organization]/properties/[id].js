import { LuArrowLeft, LuHistory, LuKeyRound, LuTrash } from 'react-icons/lu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../../../components/ui/tabs';
import { useCallback, useContext, useState } from 'react';
import { Card } from '../../../components/ui/card';
import ConfirmDialog from '../../../components/ConfirmDialog';
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
import useFillStore from '../../../hooks/useFillStore';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';
import NotesPanel from '../../../components/NotesPanel';

function PropertyOverviewCard() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  // Calculate total square footage from children if this is a parent property
  const totalSquareFootage =
    store.property.selected?.childProperties?.reduce((sum, child) => {
      return sum + (child.surface || 0);
    }, 0) || 0;

  // Check if this property has children (is a parent)
  const isParentProperty =
    (store.property.selected?.childProperties?.length || 0) > 0;
  const displayedSquareFootage = isParentProperty
    ? totalSquareFootage
    : store.property.selected?.surface || 0;

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
          {displayedSquareFootage > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t('Total Surface Area')}:
              </span>
              <span>
                {displayedSquareFootage} {t('sqm')}
              </span>
            </div>
          )}
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
      Icon={LuHistory}
      title={t('Previous tenants')}
      renderContent={() =>
        store.property.selected?.occupancyHistory?.length ? (
          store.property.selected.occupancyHistory.map((occupant) => {
            const occupationDates = t('{{beginDate}} to {{endDate}}', {
              beginDate: moment(occupant.beginDate, 'DD/MM/YYYY').format('ll'),
              endDate: moment(occupant.endDate, 'DD/MM/YYYY').format('ll')
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
        ) : (
          <span className="text-base text-muted-foreground">
            {t('Property not rented so far')}
          </span>
        )
      }
    />
  );
}

function RentCard() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  // Calculate total square footage from children if this is a parent property
  const totalSquareFootage =
    store.property.selected?.childProperties?.reduce((sum, child) => {
      return sum + (child.surface || 0);
    }, 0) || 0;

  // Check if this property has children (is a parent)
  const isParentProperty =
    (store.property.selected?.childProperties?.length || 0) > 0;
  const displayedSquareFootage = isParentProperty
    ? totalSquareFootage
    : store.property.selected?.surface || 0;

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-4">{t('Rent Information')}</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">
              {t('Rent excluding tax and expenses')}
            </span>
            <NumberFormat
              value={store.property.selected?.price}
              className="text-lg font-semibold"
            />
          </div>
          {displayedSquareFootage > 0 && (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">
                {isParentProperty ? t('Total Surface Area') : t('Surface')}
              </span>
              <span className="text-lg font-semibold">
                {displayedSquareFootage} {t('sqm')}
              </span>
            </div>
          )}
          {displayedSquareFootage > 0 && store.property.selected?.price > 0 && (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">
                {t('Rent per sqm')}
              </span>
              <span className="text-lg font-semibold">
                <NumberFormat
                  value={store.property.selected.price / displayedSquareFootage}
                />{' '}
                / {t('sqm')}
              </span>
            </div>
          )}
        </div>
      </div>
      {isParentProperty && (
        <div>
          <h3 className="text-sm font-semibold mb-4">{t('Sub-properties')}</h3>
          <div className="space-y-2">
            {store.property.selected.childProperties?.map((child) => (
              <div
                key={child._id}
                className="flex justify-between items-center py-2 border-b"
              >
                <div>
                  <div className="text-sm">{child.name}</div>
                  {child.surface > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {child.surface} {t('sqm')}
                    </div>
                  )}
                </div>
                <NumberFormat value={child.price} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

async function fetchData(store, router) {
  const results = await store.property.fetchOne(router.query.id);
  store.property.setSelected(
    store.property.items.find(({ _id }) => _id === router.query.id)
  );
  return results;
}

function Property() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const [openConfirmDeletePropertyDialog, setOpenConfirmDeletePropertyDialog] =
    useState(false);
  const [fetching] = useFillStore(fetchData, [router]);

  const handleBack = useCallback(() => {
    router.push(store.appHistory.previousPath);
  }, [router, store.appHistory.previousPath]);

  const onConfirmDeleteProperty = useCallback(() => {
    setOpenConfirmDeletePropertyDialog(true);
  }, [setOpenConfirmDeletePropertyDialog]);

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

    await router.push(store.appHistory.previousPath);
  }, [store, router, t]);

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
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Tabs defaultValue="property" className="md:col-span-2">
            <TabsList className="flex justify-start overflow-x-auto overflow-y-hidden">
              <TabsTrigger value="property" className="w-1/3">
                {t('Property')}
              </TabsTrigger>
              <TabsTrigger value="rent" className="w-1/3">
                {t('Rent')}
              </TabsTrigger>
              <TabsTrigger value="notes" className="w-1/3">
                {t('Notes')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="property">
              <Card className="p-6">
                <PropertyForm onSubmit={onSubmit} />
              </Card>
            </TabsContent>
            <TabsContent value="rent">
              <RentCard />
            </TabsContent>
            <TabsContent value="notes">
              <NotesPanel
                entityType="property"
                entityId={store.property.selected?._id}
              />
            </TabsContent>
          </Tabs>
          <div className="hidden md:grid grid-cols-1 gap-4 h-fit">
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
      </>
    </Page>
  );
}

export default withAuthentication(observer(Property));
