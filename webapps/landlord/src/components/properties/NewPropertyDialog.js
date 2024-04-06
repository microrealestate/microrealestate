import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import { NumberField, TextField } from '@microrealestate/commonui/components';
import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState
} from 'react';
import { Button } from '../ui/button';
import PropertyIcon from './PropertyIcon';
import ResponsiveDialog from '../ResponsiveDialog';
import { SelectField } from '../formfields/SelectField';
import { StoreContext } from '../../store';
import { toast } from 'sonner';
import types from './types';
import useDialog from '../../hooks/useDialog';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  type: Yup.string().required(),
  name: Yup.string().required(),
  rent: Yup.number().min(0).required()
});

const initialValues = {
  type: '',
  name: '',
  rent: ''
};

function NewPropertyDialog({ open, setOpen, backPage, backPath }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef();

  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  const _onSubmit = useCallback(
    async (propertyPart) => {
      try {
        setIsLoading(true);
        let property = {
          ...propertyPart,
          price: propertyPart.rent
        };

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

        handleClose();

        store.property.setSelected(data);
        await router.push(
          `/${store.organization.selected.name}/properties/${
            data._id
          }/${encodeURI(backPage)}/${encodeURIComponent(backPath)}`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [store, handleClose, router, backPage, backPath, t]
  );

  const propertyTypes = useMemo(
    () =>
      types.map((type) => ({
        id: type.id,
        value: type.id,
        label: t(type.labelId),
        renderIcon: () => <PropertyIcon type={type.id} />
      })),
    [t]
  );

  return (
    <ResponsiveDialog
      open={!!open}
      setOpen={setOpen}
      isLoading={isLoading}
      renderHeader={() => t('Add a property')}
      renderContent={() => (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
          innerRef={formRef}
        >
          {() => {
            return (
              <Form autoComplete="off">
                <SelectField
                  label={t('Property Type')}
                  name="type"
                  values={propertyTypes}
                />
                <TextField label={t('Name')} name="name" />
                <NumberField
                  label={t('Rent excluding tax and expenses')}
                  name="rent"
                />
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

export default function useNewPropertyDialog() {
  return useDialog(NewPropertyDialog);
}
