import { useTranslations } from 'next-intl';
import { TextField } from './TextField';

export function ContactField({
  contactName,
  emailName,
  phone1Name,
  phone2Name,
  disabled,
  readOnly
}: {
  contactName?: string;
  emailName?: string;
  phone1Name?: string;
  phone2Name?: string;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const t = useTranslations('common');
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label={t('Contact')}
        name={contactName || 'name'}
        autoComplete="name"
        disabled={disabled}
        readOnly={readOnly}
      />
      <TextField
        label={t('Email')}
        name={emailName || 'email'}
        autoComplete="email"
        disabled={disabled}
        readOnly={readOnly}
      />
      <div className="flex flex-col md:flex-row gap-4">
        <div className="grow">
          <TextField
            label={t('Phone 1')}
            name={phone1Name || 'phone1'}
            autoComplete="tel"
            disabled={disabled}
            readOnly={readOnly}
          />
        </div>
        <div className="grow">
          <TextField
            label={t('Phone 2')}
            name={phone2Name || 'phone2'}
            autoComplete="tel"
            disabled={disabled}
            readOnly={readOnly}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
