'use client';

import { toast } from '@microrealestate/commonui/components/ui/sonner';
import type { API } from '@microrealestate/shared';
import { useQuery } from '@tanstack/react-query';
import { flowResult, toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { LuTrash } from 'react-icons/lu';
import ConfirmDialog from '@/components/ConfirmDialog';
import Page from '@/components/Page';
import PropertyOverviewCard from '@/components/properties/PropertyOverviewCard';
import PropertyTabs from '@/components/properties/PropertyTabs';
import PropertyTenantsCard from '@/components/properties/PropertyTenantsCard';
import PropertyTitle from '@/components/properties/PropertyTitle';
import { useRouter } from '@/i18n/navigation';
import { useNav } from '@/providers/NavProvider';
import { useStore } from '@/providers/StoreProvider';
import type Store from '@/store/Store';
import { fetchProperties, QueryKeys } from '@/utils/restcalls';

type PropertyData = API.Landlord.Property.PropertyWithOccupancyData;

type PropertyPart = Partial<PropertyData> & { rent?: number };

function selectedProperty(store: Store) {
  return store.property.selected as Partial<PropertyData>;
}

function Property() {
  const t = useTranslations('common');
  const store = useStore();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { goBack } = useNav();
  const [openConfirmDeletePropertyDialog, setOpenConfirmDeletePropertyDialog] =
    useState(false);
  const { data: properties, isLoading } = useQuery<PropertyData[]>({
    queryKey: [QueryKeys.PROPERTIES],
    queryFn: () => fetchProperties(store)
  });

  useEffect(() => {
    if (properties) {
      store.property.setSelected(
        properties.find(({ _id }) => _id === params.id) ?? {}
      );
    }
  }, [properties, params.id, store]);

  const handleBack = () => {
    goBack('/properties');
  };

  const onConfirmDeleteProperty = () => {
    setOpenConfirmDeletePropertyDialog(true);
  };

  const onDeleteProperty = async () => {
    const { status } = await flowResult(
      store.property.delete([selectedProperty(store)._id])
    );
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
    goBack('/properties');
  };

  const onSubmitInformation = (propertyPart: PropertyPart) =>
    saveProperty(
      {
        ...propertyPart,
        price: propertyPart.rent || 0,
        stepperMode: false
      },
      { endStepper: true }
    );

  const onSubmitDetails = (propertyPart: PropertyPart) =>
    saveProperty(propertyPart, { endStepper: false });

  const saveProperty = async (
    propertyPart: PropertyPart,
    { endStepper }: { endStepper: boolean }
  ) => {
    const originalProperty = toJS(selectedProperty(store));
    const property = {
      ...originalProperty,
      ...propertyPart
    };

    if (property._id) {
      const { status, data } = await flowResult(
        store.property.update(property)
      );
      if (status !== 200) {
        switch (status) {
          case 422:
            return toast.error(
              t(
                'This type does not fit here. Detach this property, or the properties it includes, then change its type.'
              )
            );
          default:
            return toast.error(t('Something went wrong'));
        }
      }
      store.property.setSelected(data);
      if (endStepper && originalProperty.stepperMode) {
        goBack('/properties');
      } else if (!originalProperty.stepperMode) {
        toast.success(t('Changes saved'));
      }
    } else {
      const { status, data } = await flowResult(
        store.property.create(property)
      );
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
      description={t('Description, composition and tenants of this property.')}
      loading={isLoading}
      title={isLoading ? null : <PropertyTitle />}
      onBack={handleBack}
      actions={[
        {
          id: 'delete',
          label: t('Delete'),
          icon: LuTrash,
          onClick: onConfirmDeleteProperty,
          destructive: true,
          dataCy: 'removeResourceButton'
        }
      ]}
      dataCy="propertyPage"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PropertyTabs
          onSubmitInformation={onSubmitInformation}
          onSubmitDetails={onSubmitDetails}
        />
        <div className="hidden md:grid grid-cols-1 gap-4 h-fit sticky top-20">
          <PropertyOverviewCard />
          <PropertyTenantsCard />
        </div>
      </div>

      <ConfirmDialog
        title={t('Are you sure to definitely remove this property?')}
        subTitle={selectedProperty(store).name}
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
