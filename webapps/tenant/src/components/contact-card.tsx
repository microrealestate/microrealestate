import AddressMap from '@microrealestate/commonui/components/AddressMap';
import {
  Card,
  CardContent,
  CardHeader
} from '@microrealestate/commonui/components/ui/card';
import { AtSign, MapPin, Phone } from 'lucide-react';
import { Fragment } from 'react';

type ContactInfo = {
  name: string;
  contacts: {
    name: string;
    phone1: string;
    phone2?: string;
    email: string;
  }[];
  addresses?: {
    street1?: string;
    street2?: string;
    zipCode?: string;
    city?: string;
    state?: string;
    country?: string;
  }[];
};

function PhoneLinks({ phone1, phone2 }: { phone1?: string; phone2?: string }) {
  if (phone1 && phone2) {
    return (
      <>
        <a href={`tel:${phone1}`} className="hover:underline">
          {phone1}
        </a>
        {' - '}
        <a href={`tel:${phone2}`} className="hover:underline">
          {phone2}
        </a>
      </>
    );
  }

  const phone = phone1 || phone2;
  if (!phone) return null;

  return (
    <a href={`tel:${phone}`} className="hover:underline">
      {phone}
    </a>
  );
}

function ContactRows({
  contacts,
  hasPhone,
  hasEmail
}: {
  contacts: ContactInfo['contacts'];
  hasPhone: boolean;
  hasEmail: boolean;
}) {
  const multipleContacts = contacts.length > 1;

  if (!hasPhone && !hasEmail) return null;

  if (multipleContacts) {
    return (
      <>
        {contacts.map(({ name, phone1, phone2, email }, index) => {
          const hasThisPhone = !!(phone1 || phone2);
          const hasThisEmail = !!email;
          if (!hasThisPhone && !hasThisEmail) return null;
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: order not going to change
            <div key={index} className="flex flex-col gap-2">
              {name ? (
                <div className="text-xs font-medium text-muted-foreground">
                  {name}
                </div>
              ) : null}
              {hasThisPhone ? (
                <div className="flex items-start gap-2">
                  <Phone
                    size={16}
                    strokeWidth={2.5}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="text-sm">
                    <PhoneLinks phone1={phone1} phone2={phone2} />
                  </div>
                </div>
              ) : null}
              {hasThisEmail ? (
                <div className="flex items-start gap-2">
                  <AtSign
                    size={16}
                    strokeWidth={2.5}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="text-sm">
                    <a href={`mailto:${email}`} className="hover:underline">
                      {email}
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </>
    );
  }

  return (
    <>
      {hasPhone ? (
        <div className="flex items-start gap-2">
          <Phone size={16} strokeWidth={2.5} className="mt-0.5 shrink-0" />
          <div className="text-sm">
            {contacts.map(({ name, phone1, phone2 }, index) => (
              <Fragment
                key={`phone-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: index is not going to change
                  index
                }`}
              >
                {name && (phone1 || phone2) ? (
                  <>
                    {name}
                    <br />
                  </>
                ) : null}
                <PhoneLinks phone1={phone1} phone2={phone2} />
              </Fragment>
            ))}
          </div>
        </div>
      ) : null}
      {hasEmail ? (
        <div className="flex items-start gap-2">
          <AtSign size={16} strokeWidth={2.5} className="mt-0.5 shrink-0" />
          <div className="text-sm flex flex-col gap-1">
            {contacts.map(({ email }) =>
              email ? (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="hover:underline"
                >
                  {email}
                </a>
              ) : null
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

export default async function ContactCard({
  contactInfo,
  showCard = false
}: {
  contactInfo: ContactInfo;
  showCard?: boolean;
}) {
  const hasPhone = contactInfo.contacts.some(
    ({ phone1, phone2 }) => phone1 || phone2
  );
  const hasEmail = contactInfo.contacts.some(({ email }) => email);
  const hasAddressContent = ({
    street1,
    street2,
    zipCode,
    city,
    state,
    country
  }: NonNullable<ContactInfo['addresses']>[number]) =>
    !!(street1 || street2 || zipCode || city || state || country);

  const hasAddress = contactInfo.addresses?.some(hasAddressContent);

  const firstAddress = contactInfo.addresses?.find(hasAddressContent);

  const addressBlock = hasAddress ? (
    <div className="flex items-start gap-2">
      <MapPin size={16} strokeWidth={2.5} className="mt-0.5 shrink-0" />
      <div className="flex flex-col gap-2 text-sm">
        {contactInfo.addresses?.map((address, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: order not going to change
          <div key={`address-${index}`}>
            {address.street1 ? <div>{address.street1}</div> : null}
            {address.street2 ? <div>{address.street2}</div> : null}
            {address.zipCode || address.city ? (
              <div>
                {[address.zipCode, address.city].filter(Boolean).join(' ')}
              </div>
            ) : null}
            {address.state ? <div>{address.state}</div> : null}
            {address.country ? <div>{address.country}</div> : null}
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const addressMapBlock = firstAddress ? (
    <AddressMap address={firstAddress} />
  ) : null;

  if (showCard) {
    return (
      <Card className="shadow" data-cy="contact-card">
        <CardHeader className="pb-3">
          <div className="text-xl font-semibold">{contactInfo.name}</div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-0">
          <ContactRows
            contacts={contactInfo.contacts}
            hasPhone={hasPhone}
            hasEmail={hasEmail}
          />
          {addressBlock}
          {addressMapBlock}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-cy="contact-card">
      <div className="text-xl font-semibold">{contactInfo.name}</div>
      <ContactRows
        contacts={contactInfo.contacts}
        hasPhone={hasPhone}
        hasEmail={hasEmail}
      />
      {addressBlock}
      {addressMapBlock}
    </div>
  );
}
