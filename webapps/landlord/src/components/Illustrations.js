import config from '../config';
import Image from 'next/image';
import useTranslation from 'next-translate/useTranslation';

function Illustration({ src, label, alt, priority = false }) {
  return (
    <div className="flex flex-col gap-4 items-center w-full h-full">
      <div className="relative w-full h-full">
        <Image src={src} alt={alt} priority={priority} fill />
      </div>
      {!!label && <p className="text-xl text-muted-foreground">{label}</p>}
    </div>
  );
}

export const SignInUpIllustration = ({ label }) => {
  const { t } = useTranslation('common');
  return (
    <div className="h-64 w-full">
      <Illustration
        src={`${config.BASE_PATH}/undraw_choosing_house_re_1rv7.svg`}
        priority={true}
        alt="welcome"
      />
    </div>
  );
};

export const EmptyIllustration = ({ label }) => {
  const { t } = useTranslation('common');
  return (
    <div className="h-64 w-full">
      <Illustration
        src={`${config.BASE_PATH}/undraw_Empty_re_opql.svg`}
        label={label || t('No data found')}
        priority={true}
        alt="no data found"
      />
    </div>
  );
};

export const LocationIllustration = () => (
  <div className="h-64 w-full">
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
  <div className="h-64 w-full">
    <Illustration
      src={`${config.BASE_PATH}/undraw_project_completed_re_jr7u.svg`}
      priority={true}
      alt="welcome"
    />
  </div>
);

export const CelebrationIllustration = ({ label }) => (
  <div className={`h-56 w-full`}>
    <Illustration
      src={`${config.BASE_PATH}/undraw_Celebration_re_kc9k.svg`}
      label={label}
      alt="celebration"
    />
  </div>
);
