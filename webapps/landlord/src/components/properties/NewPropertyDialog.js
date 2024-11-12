import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import React, { useCallback, useContext, useRef, useState } from 'react';
import { Button } from '../ui/button';
import PropertyIcon from './PropertyIcon';
import ResponsiveDialog from '../ResponsiveDialog';
import { SelectField } from '../formfields/SelectField';
import { StoreContext } from '../../store';
import { SwitchField } from '../formfields/SwitchField';
import { TextField } from '../formfields/TextField';
import { toast } from 'sonner';
import { toJS } from 'mobx';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

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
          ...propertyPart
        };

        if (propertyPart.isCopyFrom) {
          const { _id, ...originalProperty } = toJS(
            store.property.items.find(
              ({ _id }) => propertyPart.copyFrom === _id
            )
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
        store.appHistory.setPreviousPath(router.asPath);
        await router.push(
          `/${store.organization.selected.name}/properties/${data._id}`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [store, handleClose, router, t]
  );

  // transform to use it in select field
  const properties = store.property.items.map(({ _id, name, type }) => {
    return {
      id: _id,
      label: name,
      value: _id,
      renderIcon: () => <PropertyIcon type={type} />
    };
  });

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
          {({ values }) => {
            return (
              <Form autoComplete="off">
                <div className="pt-6 space-y-4">
                  <TextField label={t('Name')} name="name" />
                  {properties?.length ? (
                    <>
                      <SwitchField
                        name="isCopyFrom"
                        label={t('Copy from an existing property')}
                        aria-label={t('Copy from an existing property')}
                      />
                      <SelectField
                        name="copyFrom"
                        label={t('Property')}
                        values={properties}
                        disabled={!values.isCopyFrom}
                      />
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
