import { NumberField } from '@microrealestate/commonui/components/formfields/NumberField';
import { SelectField } from '@microrealestate/commonui/components/formfields/SelectField';
import { SwitchField } from '@microrealestate/commonui/components/formfields/SwitchField';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { toast } from '@microrealestate/commonui/components/ui/sonner';
import {
  type Address,
  canContain,
  type PropertyKind
} from '@microrealestate/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik, type FormikProps } from 'formik';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import * as Yup from 'yup';
import { useRouter } from '@/i18n/navigation';
import { useStore } from '@/providers/StoreProvider';
import { fetchProperties, QueryKeys } from '@/utils/restcalls';
import ResponsiveDialog from '../ResponsiveDialog';
import {
  ancestors,
  canHaveParent,
  defaultChildKind,
  NO_PARENT,
  parentCandidates,
  parentPath,
  type Unit
} from './composition';
import PropertyIcon from './PropertyIcon';
import types from './types';

type Values = {
  parentId: string;
  type: PropertyKind | '';
  name: string;
  availableForRent: boolean;
  rent: number | '';
};

type PropertyUnit = Unit & { address?: Address };

type StoreResult = { status: number; data?: Unit };
function result(flowCall: unknown) {
  return flowCall as Promise<StoreResult>;
}

const GROUP_KINDS: readonly string[] = ['estate', 'building', 'floor'];

const validationSchema = Yup.object().shape({
  type: Yup.string().required(),
  name: Yup.string().required(),
  rent: Yup.number()
    .transform((value, original) => (original === '' ? undefined : value))
    .min(0)
    .when('availableForRent', {
      is: true,
      then: (schema) => schema.required()
    }),
  availableForRent: Yup.boolean()
});

function inheritedAddress(parent: PropertyUnit, units: PropertyUnit[]) {
  return [parent, ...ancestors(parent, units).reverse()].find(
    ({ address }) => !!(address?.street1 || address?.city)
  );
}

export default function NewPropertyDialog({
  open,
  setOpen,
  parent,
  openAfterAdd = false,
  withDetails = true
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  parent?: Unit;
  openAfterAdd?: boolean;
  withDetails?: boolean;
}) {
  const t = useTranslations('common');
  const store = useStore();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<FormikProps<Values>>(null);
  // set by the footer button pressed: Formik's submit carries no argument
  const openAfterRef = useRef(false);
  const router = useRouter();

  const propertiesQuery = useQuery({
    queryKey: [QueryKeys.PROPERTIES],
    queryFn: () => fetchProperties(store),
    refetchOnMount: 'always',
    retry: 3,
    enabled: !!open
  });
  const units: PropertyUnit[] = propertiesQuery.data ?? [];
  const unitsById = new Map(units.map((unit) => [unit._id, unit]));

  const initialType = (parent && defaultChildKind(parent, units)) || '';
  const initialValues: Values = {
    parentId: parent?._id ?? NO_PARENT,
    type: initialType,
    name: '',
    availableForRent: !GROUP_KINDS.includes(initialType),
    rent: ''
  };

  const handleClose = () => setOpen(false);

  const _onSubmit = async (values: Values) => {
    try {
      setIsLoading(true);
      const selectedParent = unitsById.get(values.parentId);
      const addressFrom =
        selectedParent && inheritedAddress(selectedParent, units);
      const property = {
        name: values.name,
        type: values.type,
        parentId: selectedParent?._id,
        availableForRent: values.availableForRent,
        price: values.availableForRent && values.rent !== '' ? values.rent : 0,
        ...(addressFrom ? { address: addressFrom.address } : {}),
        stepperMode: openAfterRef.current
      };

      const { status, data } = await result(store.property.create(property));
      if (status !== 200 || !data) {
        switch (status) {
          case 422:
            return toast.error(
              t('This property cannot be attached to the selected property')
            );
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
      if (openAfterRef.current) {
        store.property.setSelected(data);
        await router.push(`/properties/${data._id}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const typeValues = types
    .filter(({ id }) => !parent || canContain(parent.type, id as PropertyKind))
    .map(({ id, labelId }) => ({
      id,
      value: id,
      label: t(labelId),
      renderIcon: () => <PropertyIcon type={id} className="size-4" />
    }));

  return (
    <ResponsiveDialog
      open={!!open}
      setOpen={setOpen}
      isLoading={isLoading}
      title={t('Add a property')}
      renderHeader={undefined}
      renderContent={() => (
        <Formik
          // starts over each time the dialog opens, and once the properties
          // are loaded so the pre-filled kind follows the existing ones
          key={`${parent?._id ?? NO_PARENT}-${propertiesQuery.isSuccess}`}
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
          innerRef={formRef}
        >
          {({ values, setFieldValue }) => {
            const type = values.type || undefined;
            const candidates = type
              ? parentCandidates(undefined, type, units)
              : [];
            const parentValues = [
              {
                id: NO_PARENT,
                value: NO_PARENT,
                label: t('Not part of another property')
              },
              ...candidates.map((unit) => ({
                id: unit._id,
                value: unit._id,
                label: [...parentPath(unit, units), unit.name].join(' › '),
                renderIcon: () => (
                  <PropertyIcon
                    type={unit.type}
                    className="size-4"
                    aria-hidden="true"
                  />
                )
              }))
            ];
            const selectedParent = unitsById.get(values.parentId);
            const addressFrom =
              selectedParent && inheritedAddress(selectedParent, units);

            const onTypeChange = ({
              target: { value }
            }: {
              target: { value: string };
            }) => {
              const next = value as PropertyKind;
              setFieldValue('availableForRent', !GROUP_KINDS.includes(next));
              const currentParent = unitsById.get(values.parentId);
              if (currentParent && !canContain(currentParent.type, next)) {
                setFieldValue('parentId', NO_PARENT);
              }
            };

            return (
              <Form autoComplete="off" className="w-full">
                <div className="pt-6 space-y-4">
                  <SelectField
                    label={t('Property Type')}
                    name="type"
                    values={typeValues}
                    onChange={onTypeChange}
                  />
                  {type && canHaveParent(type) && candidates.length ? (
                    <div>
                      <SelectField
                        // the select keeps its first value: remount it when
                        // the kind changes, since the place may reset with it
                        key={type}
                        label={t('Part of')}
                        name="parentId"
                        values={parentValues}
                        disabled={!!parent}
                      />
                      {addressFrom ? (
                        <p className="text-sm text-muted-foreground">
                          {t('Same address as {name}', {
                            name: addressFrom.name
                          })}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <TextField label={t('Name')} name="name" />
                  <SwitchField
                    name="availableForRent"
                    label={t('Offered for rent')}
                    dataCy="availableForRent"
                  />
                  {values.availableForRent ? (
                    <NumberField
                      label={t('Base rent, excluding charges and VAT')}
                      name="rent"
                    />
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
          {openAfterAdd || !withDetails ? null : (
            <Button
              variant="outline"
              onClick={() => {
                openAfterRef.current = true;
                formRef.current?.submitForm();
              }}
              data-cy="submitPropertyAndEdit"
            >
              {t('Add more details')}
            </Button>
          )}
          <Button
            onClick={() => {
              openAfterRef.current = openAfterAdd;
              formRef.current?.submitForm();
            }}
            data-cy="submitProperty"
          >
            {t('Add')}
          </Button>
        </>
      )}
    />
  );
}
