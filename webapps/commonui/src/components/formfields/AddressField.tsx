import { useField } from 'formik';
import { useTranslations } from 'next-intl';
import FormField from './FormField';
import { TextField } from './TextField';

type AddressFieldKey =
  | 'street1'
  | 'street2'
  | 'city'
  | 'zipCode'
  | 'state'
  | 'country';

export function AddressField({
  disabled,
  readOnly,
  error
}: {
  disabled?: boolean;
  readOnly?: boolean;
  error?: Partial<Record<AddressFieldKey, boolean>>;
}) {
  const t = useTranslations('common');
  const [addressField] = useField('address');

  if (readOnly) {
    const address = addressField.value;
    if (!address?.street1) {
      return null;
    }
    const parts = [
      address.street1,
      address.street2,
      address.zipCode,
      address.city,
      address.state,
      address.country
    ].filter(Boolean);
    return (
      <FormField name={addressField.name} label={t('Address')}>
        <div className="py-2 font-medium whitespace-pre-wrap">
          {parts.join('\n')}
        </div>
      </FormField>
    );
  }

  return (
    <div className="space-y-4">
      <TextField
        label={t('Street 1')}
        name="address.street1"
        autoComplete="address-line1"
        disabled={disabled}
        error={error?.street1}
      />
      <TextField
        label={t('Street 2')}
        name="address.street2"
        autoComplete="address-line2"
        disabled={disabled}
        error={error?.street2}
      />
      <div className="flex flex-col gap-4 md:grid md:grid-cols-6">
        <div className="col-span-3">
          <TextField
            label={t('City')}
            name="address.city"
            autoComplete="address-level2"
            disabled={disabled}
            error={error?.city}
          />
        </div>
        <div className="md:col-span-3">
          <TextField
            label={t('Postal code')}
            name="address.zipCode"
            autoComplete="postal-code"
            disabled={disabled}
            error={error?.zipCode}
          />
        </div>

        <div className="md:col-span-3">
          <TextField
            label={t('State')}
            name="address.state"
            autoComplete="address-level1"
            disabled={disabled}
            error={error?.state}
          />
        </div>
        <div className="md:col-span-3">
          <TextField
            label={t('Country')}
            name="address.country"
            autoComplete="country"
            disabled={disabled}
            error={error?.country}
          />
        </div>
      </div>
    </div>
  );
}
