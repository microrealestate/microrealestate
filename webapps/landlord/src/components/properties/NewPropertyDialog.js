import { SelectField } from '@microrealestate/commonui/components/formfields/SelectField';
import { SwitchField } from '@microrealestate/commonui/components/formfields/SwitchField';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { toJS } from 'mobx';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';
import { useRouter } from '@/i18n/navigation';
import { useStore } from '@/providers/StoreProvider';
import { fetchProperties, QueryKeys } from '@/utils/restcalls';
import ResponsiveDialog from '../ResponsiveDialog';
import PropertyIcon from './PropertyIcon';

const validationSchema = Yup.object().shape({
  name: Yup.string().required(),
  isCopyFrom: Yup.boolean(),
  copyFrom: Yup.mixed().when('isCopyFrom', {
    is: true,
    then: Yup.string().required()
  })
});

const initialValues = {
  name: '',
  copyFrom: '',
  isCopyFrom: false
};

export default function NewPropertyDialog({ open, setOpen }) {
  const t = useTranslations('common');
  const store = useStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef();

  const propertiesQuery = useQuery({
    queryKey: [QueryKeys.PROPERTIES],
    queryFn: () => fetchProperties(store),
    refetchOnMount: 'always',
    retry: 3,
    enabled: !!open
  });

  const handleClose = () => setOpen(false);

  const _onSubmit = async (propertyPart) => {
    try {
      setIsLoading(true);
      let property = {
        ...propertyPart,
        stepperMode: true
      };

      if (propertyPart.isCopyFrom) {
        const { _id, ...originalProperty } = toJS(
          store.property.items.find(({ _id }) => propertyPart.copyFrom === _id)
        );

        property = {
          ...originalProperty,
          ...property
        };
      }

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

      queryClient.invalidateQueries({ queryKey: [QueryKeys.PROPERTIES] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PROPERTY_COUNT] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.OCCUPANCY_RATE] });
      handleClose();

      store.property.setSelected(data);
      await router.push(`/properties/${data._id}`);
    } finally {
      setIsLoading(false);
    }
  };

  // transform to use it in select field
  const properties =
    propertiesQuery.data?.map(({ _id, name, type }) => {
      return {
        id: _id,
        label: name,
        value: _id,
        renderIcon: () => <PropertyIcon type={type} />
      };
    }) ?? [];

  return (
    <ResponsiveDialog
      open={!!open}
      setOpen={setOpen}
      isLoading={isLoading}
      title={t('Add a property')}
      renderContent={() => (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
          innerRef={formRef}
        >
          {({ values }) => {
            return (
              <Form autoComplete="off" className="w-full">
                <div className="pt-6 space-y-4">
                  <TextField label={t('Name')} name="name" />
                  {properties?.length ? (
                    <>
                      <SwitchField
                        name="isCopyFrom"
                        label={t('Copy from an existing property')}
                        aria-label={t('Copy from an existing property')}
                      />
                      {values.isCopyFrom ? (
                        <SelectField
                          name="copyFrom"
                          label={t('Property')}
                          values={properties}
                        />
                      ) : null}
                    </>
                  ) : null}
                </div>
              </Form>
            );
          }}
        </Formik>
      )}
      renderFooter={() => (
        <>
          <Button variant="outline" onClick={handleClose}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={() => formRef.current.submitForm()}
            data-cy="submitProperty"
          >
            {t('Add')}
          </Button>
        </>
      )}
    />
  );
}
