import config from '../config';
import Image from 'next/image';
import useTranslation from 'next-translate/useTranslation';

function Illustration({ src, label, alt }) {
  return (
    <div className="flex flex-col gap-4 items-center w-full h-full">
      <div className="relative w-full h-full">
        <Image src={src} alt={alt} fill />
      </div>
      {!!label && <p className="text-xl text-muted-foreground">{label}</p>}
    </div>
  );
}

export const EmptyIllustration = ({ label }) => {
  const { t } = useTranslation('common');
  return (
    <div className="h-64 w-full">
      <Illustration
        src={`${config.BASE_PATH}/undraw_Empty_re_opql.svg`}
        label={label || t('No data found')}
        alt="no data found"
      />
    </div>
  );
};

export const LocationIllustration = ({ height }) => (
  <div className={`h-[${height}px] w-full`}>
    <Illustration
      src={`${config.BASE_PATH}/undraw_Location_tracking.svg`}
      alt="no location found"
    />
  </div>
);

export const BlankDocumentIllustration = () => (
  <div className="h-64 w-full">
    <Illustration
      src={`${config.BASE_PATH}/undraw_add_document_re_mbjx.svg`}
      alt="blank document"
    />
  </div>
);

export const TermsDocumentIllustration = ({ alt = '' }) => (
  <div className="h-64 w-full">
    <Illustration
      src={`${config.BASE_PATH}/undraw_Terms_re_6ak4.svg`}
      alt={alt}
    />
  </div>
);

export const WelcomeIllustration = () => (
  <Illustration
    src={`${config.BASE_PATH}/undraw_apartment_rent_o0ut.svg`}
    alt="welcome"
  />
);

export const CelebrationIllustration = ({ label, height }) => (
  <div className={`h-[${height}px] w-full`}>
    <Illustration
      src={`${config.BASE_PATH}/undraw_Celebration_re_kc9k.svg`}
      label={label}
      alt="celebration"
    />
  </div>
);
