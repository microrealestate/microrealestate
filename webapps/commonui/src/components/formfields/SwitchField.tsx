import { useField } from 'formik';
import { useTranslations } from 'next-intl';
import { cn } from '../../utils';
import { Switch } from '../ui/switch';
import FormField from './FormField';
import useFormError from './useFormError';

export function SwitchField({
  disabled,
  readOnly,
  dataCy,
  ...props
}: {
  disabled?: boolean;
  readOnly?: boolean;
  dataCy?: string;
  name: string;
  label?: string;
  'data-cy'?: string;
}) {
  const [field] = useField(props.name);
  const { errorMessage, hasError } = useFormError({ name: props.name });
  const t = useTranslations('common');

  if (readOnly) {
    return (
      <FormField name={props.name} label={props.label ?? ''}>
        <div className="py-2 text-sm font-medium">
          {field.value ? t('Yes') : t('No')}
        </div>
      </FormField>
    );
  }

  return (
    <div className="relative pb-2">
      <div className="flex items-center gap-1">
        <Switch
          data-cy={dataCy ?? props['data-cy']}
          name={props.name}
          checked={field.value}
          onCheckedChange={(value) =>
            field.onChange({ target: { value, name: field.name } })
          }
          disabled={disabled}
        />
        {props.label ? (
          <label
            htmlFor={props.name}
            className={cn('text-muted-foreground leading-none')}
          >
            {props.label}
          </label>
        ) : null}
      </div>
      {hasError && (
        <div className="absolute left-0.5 -bottom-3 text-destructive text-xs font-semibold">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
