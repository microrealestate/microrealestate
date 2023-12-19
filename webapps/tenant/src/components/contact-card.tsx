import { AtSign, MapPin, Phone } from 'lucide-react';
import getTranslation from '@/utils/i18n/server/getTranslation';

export default async function ContactCard({
  variant,
  contactInfo,
}: {
  variant: 'tenant' | 'landlord';
  contactInfo: {
    name: string;
    contacts: {
      name: string;
      phone1: string;
      phone2?: string;
      email: string;
    }[];
    addresses: {
      street1: string;
      street2?: string;
      zipCode: string;
      city: string;
      state?: string;
      country?: string;
    }[];
  };
}) {
  const { t } = await getTranslation();
  const hasPhone = contactInfo.contacts.some(
    ({ phone1, phone2 }) => phone1 || phone2
  );
  const hasEmail = contactInfo.contacts.some(({ email }) => email);
  const hasAddress = contactInfo.addresses.some(
    ({ street1, street2, zipCode, city, state, country }) =>
      street1 || street2 || zipCode || city || state || country
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="text-xl font-semibold">
        {contactInfo.name}{' '}
        <span className="text-xs text-muted-foreground uppercase font-semibold">
          {t(variant === 'landlord' ? 'Landlord' : 'Tenant')}
        </span>
      </div>
      {hasPhone ? (
        <div className="flex items-start gap-2">
          <Phone size={16} strokeWidth={2.5} />
          <div className="text-sm">
            {contactInfo.contacts.map(({ name, phone1, phone2 }) => (
              <>
                {name && (phone1 || phone2) ? (
                  <>
                    {name}
                    <br />
                  </>
                ) : null}
                {phone1 && phone2 ? `${phone1} - ${phone2}` : null}
                {phone1 && !phone2 ? phone1 : null}
              </>
            ))}
          </div>
        </div>
      ) : null}
      {hasEmail ? (
        <div className="flex items-start gap-2">
          <AtSign size={16} strokeWidth={2.5} />
          <div className="text-sm">
            {contactInfo.contacts.map(({ email }) =>
              email ? <div key={email}>{email}</div> : null
            )}
          </div>
        </div>
      ) : null}
      {hasAddress ? (
        <div className="flex items-start gap-2">
          <MapPin size={16} strokeWidth={2.5} />
          <div className="flex flex-col gap-2 text-sm">
            {contactInfo.addresses.map((address, index) => (
              <div key={index}>
                {address.street1 ? <div>{address.street1}</div> : null}
                {address.street2 ? <div>{address.street2}</div> : null}
                {address.zipCode && address.city ? (
                  <div>
                    {address.zipCode} {address.city}
                  </div>
                ) : null}
                {!address.zipCode && address.city ? (
                  <div>{address.city}</div>
                ) : null}
                {address.state ? <div>{address.state}</div> : null}
                {address.country ? <div>{address.country}</div> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
