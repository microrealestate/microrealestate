import '../../config/yupConfig';
import { useField, useFormikContext } from 'formik';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

export default function useFormError({ name } = { name: '' }) {
  const {
    isValid: isFormValid,
    submitCount,
    getFieldMeta
  } = useFormikContext();
  const t = useTranslations('common');
  const [_input, meta, _helpers] = useField(name);

  const hasError = useMemo(() => {
    let hasError =
      meta.touched && meta.value !== meta.initialValue && !!meta.error;

    if (submitCount > 0) {
      const fieldMeta = getFieldMeta(name);
      hasError = !isFormValid && !!fieldMeta.error;
    }
    return hasError;
  }, [meta, isFormValid, submitCount, getFieldMeta, name]);

  const errorMessage = useMemo(() => {
    if (!hasError) {
      return '';
    }

    if (typeof meta.error === 'string') {
      return t(meta.error || 'Invalid field');
    }

    if (Array.isArray(meta.error)) {
      const [key, data] = meta.error as [string, Record<string, string>];
      return t(key, data);
    }

    return t('Invalid field');
  }, [hasError, meta.error, t]);

  return { errorMessage, hasError };
}
