'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { BASE_PATH } from '@/utils/basepath';

function Illustration({ src, label, alt, priority = false }) {
  const fullSrc = `${BASE_PATH}${src}`;

  return (
    <div className="flex flex-col gap-4 items-center w-full h-full">
      <div className="relative w-full h-full">
        <Image src={fullSrc} alt={alt} priority={priority} fill />
      </div>
      {!!label && <p className="text-xl text-muted-foreground">{label}</p>}
    </div>
  );
}

export const SignInUpIllustration = () => {
  return (
    <div className="h-64 w-full">
      <Illustration
        src="/undraw_choosing_house_re_1rv7.svg"
        priority={true}
        alt="welcome"
      />
    </div>
  );
};

export const EmptyIllustration = ({ label }) => {
  const t = useTranslations('common');
  return (
    <div className="h-64 w-full">
      <Illustration
        src="/undraw_Empty_re_opql.svg"
        label={label || t('No data found')}
        priority={true}
        alt="no data found"
      />
    </div>
  );
};

export const BlankDocumentIllustration = () => {
  return (
    <div className="h-64 w-full">
      <Illustration
        src="/undraw_add_document_re_mbjx.svg"
        alt="blank document"
      />
    </div>
  );
};

export const TermsDocumentIllustration = ({ alt = '' }) => {
  return (
    <div className="h-64 w-full">
      <Illustration src="/undraw_Terms_re_6ak4.svg" alt={alt} />
    </div>
  );
};
