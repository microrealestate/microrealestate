import { Form, Formik } from 'formik';
import { QueryKeys, fetchProperties } from '../../../utils/restcalls';
import PropertyList from '../../properties/PropertyList';
import { useCallback, useMemo, useContext, useRef } from 'react';
import {  useQueryClient } from '@tanstack/react-query';
import { Button } from '../../ui/button';
import ResponsiveDialog from '../../ResponsiveDialog';
import { SelectField } from '../../formfields/SelectField';
import { StoreContext } from '../../../store';
import { useQuery } from '@tanstack/react-query';
import useTranslation from 'next-translate/useTranslation';

const memberInitialValues = {
};

export default function PropertyManagerRemovePropDialog({
  open,
  setOpen,
  data,
  onSave
}) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const formRef = useRef();
  const queryClient = useQueryClient();

  const { data: allProperties } = useQuery({
    queryKey: [QueryKeys.PROPERTIES],
    queryFn: () => fetchProperties(store),
    refetchOnMount: 'always',
    retry: 3,
  });

  // transform to use it in select field
  const propValues = useMemo(() => {
    return allProperties?.map((prop) => ({
    id: prop._id,
    label: prop.name + ": " + prop.address.street1 + ", " + prop.address.city + ", " + prop.address.state,
    value: prop._id,
    }));
  }, [allProperties]);

 const memberProperties = useMemo(() => {
    return allProperties?.filter(
      ({ _id }) => data?.properties?.includes(_id)
    );
  }, [allProperties, data]);

  const handleSave = useCallback(() => {
    setOpen(false);
    onSave?.(data);
  }, [setOpen, onSave, data]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const handleSelectChange = useCallback(
    (prop) => {
      if(data?.properties?.includes(prop))
      {
        console.log('Removing Prop to member');
        data.properties = data.properties.filter((item) => item !== prop);
      }
    }, [data]);

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      renderHeader={() => 'Remove Properties'}
      renderContent={() => (
        <Formik
          initialValues={memberInitialValues}
          onSubmit={handleSave}
          innerRef={formRef}
        >
          {() => {
            return (
              <Form autoComplete="off">
                <div className="pt-6 space-y-4">
                  <div>{'Currently Assigned Properties'}</div>
                  <PropertyList
                    data={memberProperties}
                  />
                  <SelectField
                    label={'Select Property To Remove'}
                    name="property"
                    values={propValues}
                    onValueChange={handleSelectChange}
                  />
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
          <Button onClick={handleSave}>
            {t('Remove')}
          </Button>
        </>
      )}
    />
  );
}