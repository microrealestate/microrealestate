import { Section } from '@microrealestate/commonui/components/formfields/Section';
import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
import { TextAreaField } from '@microrealestate/commonui/components/formfields/TextAreaField';
import useFormError from '@microrealestate/commonui/components/formfields/useFormError';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { Input } from '@microrealestate/commonui/components/ui/input';
import { cn } from '@microrealestate/commonui/utils';
import {
  customFieldNameKey,
  type PropertyCustomField
} from '@microrealestate/shared';
import { FieldArray, Form, Formik, useField, useFormikContext } from 'formik';
import { observer } from 'mobx-react-lite';
import { nanoid } from 'nanoid';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LuCirclePlus, LuPencil, LuX } from 'react-icons/lu';
import * as Yup from 'yup';
import { useStore } from '@/providers/StoreProvider';

type CustomFieldValues = { key: string; label: string; value: string };

type DetailsValues = {
  notes: string;
  customFields: CustomFieldValues[];
};

type SelectedProperty = {
  notes?: string;
  customFields?: PropertyCustomField[];
};

const validationSchema = Yup.object().shape({
  notes: Yup.string().max(5000),
  customFields: Yup.array()
    .of(
      Yup.object().shape({
        label: Yup.string().trim().max(100).required(),
        value: Yup.string().max(500)
      })
    )
    .test('unique-names', function (fields) {
      const seen = new Set<string>();
      for (const [index, field] of (fields ?? []).entries()) {
        const name = customFieldNameKey(field?.label ?? '');
        if (!name) continue;
        if (seen.has(name)) {
          return this.createError({
            path: `customFields[${index}].label`,
            message: 'A field with this name already exists'
          });
        }
        seen.add(name);
      }
      return true;
    })
});

function toPropertyPart({ customFields, ...values }: DetailsValues) {
  return {
    ...values,
    customFields: customFields.map(({ label, value }) => ({ label, value }))
  };
}

function CustomFieldRow({
  index,
  onRemove
}: {
  index: number;
  onRemove: () => void;
}) {
  const t = useTranslations('common');
  const { isSubmitting } = useFormikContext();
  const labelName = `customFields[${index}].label`;
  const [labelField, , labelHelpers] = useField<string>(labelName);
  const [valueField] = useField<string>(`customFields[${index}].value`);
  const { errorMessage, hasError } = useFormError({ name: labelName });
  const [editing, setEditing] = useState(() => !labelField.value);
  const labelBeforeEdit = useRef('');
  const renameButton = useRef<HTMLButtonElement>(null);
  const refocusAfterEdit = useRef(false);

  const isEditing = editing || !labelField.value;
  const name = labelField.value;

  useEffect(() => {
    if (!isEditing && refocusAfterEdit.current) {
      refocusAfterEdit.current = false;
      renameButton.current?.focus();
    }
  }, [isEditing]);

  const startEditing = () => {
    labelBeforeEdit.current = labelField.value;
    setEditing(true);
  };

  const stopEditing = (refocus: boolean) => {
    refocusAfterEdit.current = refocus;
    setEditing(false);
  };

  return (
    <div className="relative pb-2">
      <div className="flex h-8 items-center mb-1">
        {isEditing ? (
          <Input
            {...labelField}
            autoFocus
            aria-label={t('Name')}
            placeholder={t('Name')}
            readOnly={isSubmitting}
            onFocus={() => {
              if (!editing) {
                startEditing();
              }
            }}
            className={cn(
              'h-8 max-w-sm px-2 py-0 text-sm focus-visible:ring-offset-0',
              hasError && 'border-destructive'
            )}
            onBlur={(event) => {
              labelField.onBlur(event);
              stopEditing(false);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                stopEditing(true);
              } else if (event.key === 'Escape') {
                labelHelpers.setValue(labelBeforeEdit.current);
                stopEditing(true);
              }
            }}
          />
        ) : (
          <button
            ref={renameButton}
            type="button"
            onClick={startEditing}
            aria-label={t('Rename {name}', { name })}
            title={t('Rename {name}', { name })}
            className="flex items-center gap-1.5 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-cy={`editCustomField${index}`}
          >
            <span>{name}</span>
            <LuPencil className="size-3.5" aria-hidden />
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          {...valueField}
          aria-label={name || t('Name')}
          readOnly={isSubmitting}
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label={name ? t('Delete {name}', { name }) : t('Delete')}
          title={name ? t('Delete {name}', { name }) : t('Delete')}
          onClick={(event) => {
            event.preventDefault();
            onRemove();
          }}
          data-cy={`removeCustomField${index}`}
        >
          <LuX className="size-4" />
        </Button>
      </div>
      {hasError && (
        <div className="absolute left-0.5 -bottom-3 text-destructive text-xs font-semibold">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

function CustomFieldList() {
  const t = useTranslations('common');
  const { values } = useFormikContext<DetailsValues>();

  return (
    <FieldArray
      name="customFields"
      render={(arrayHelpers) => (
        <>
          {values.customFields.map((field, index) => (
            <CustomFieldRow
              key={field.key}
              index={index}
              onRemove={() => arrayHelpers.remove(index)}
            />
          ))}
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1"
              onClick={(event) => {
                event.preventDefault();
                arrayHelpers.push({ key: nanoid(), label: '', value: '' });
              }}
              data-cy="addCustomField"
            >
              <LuCirclePlus className="size-4" />
              {t('Add a field')}
            </Button>
          </div>
        </>
      )}
    />
  );
}

type PropertyDetailsFormProps = {
  onSubmit: (propertyPart: Record<string, unknown>) => Promise<unknown>;
};

const PropertyDetailsForm = observer(function PropertyDetailsForm({
  onSubmit
}: PropertyDetailsFormProps) {
  const t = useTranslations('common');
  const store = useStore();
  const selected = store.property.selected as SelectedProperty;

  const initialValues: DetailsValues = useMemo(
    () => ({
      notes: selected?.notes || '',
      customFields: (selected?.customFields ?? []).map(({ label, value }) => ({
        key: nanoid(),
        label,
        value: value ?? ''
      }))
    }),
    [selected]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      enableReinitialize={false}
      onSubmit={(values) => onSubmit(toPropertyPart(values))}
    >
      <Form autoComplete="off">
        <Section
          label={t('Additional information')}
          description={t(
            'Add details about this property, such as its insurer or its year of construction.'
          )}
        >
          <CustomFieldList />
        </Section>
        <Section label={t('Notes')}>
          <TextAreaField label={t('Notes')} name="notes" hideLabel />
        </Section>
        <SubmitButton label={t('Save')} />
      </Form>
    </Formik>
  );
});

export default PropertyDetailsForm;
