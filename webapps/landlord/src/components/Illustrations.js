import config from '../config';
import { Illustration } from '@microrealestate/commonui/components';
import useTranslation from 'next-translate/useTranslation';

export const EmptyIllustration = ({ label }) => {
  const { t } = useTranslation();
  return (
    <Illustration
      src={`${config.BASE_PATH}/undraw_Empty_re_opql.svg`}
      label={label || t('No data found')}
      alt="no data found"
    />
  );
};

export const LocationIllustration = ({ width, height }) => (
  <Illustration
    src={`${config.BASE_PATH}/undraw_Location_tracking.svg`}
    alt="no location found"
    width={width}
    height={height}
  />
);

export const BlankDocumentIllustration = () => (
  <Illustration
    src={`${config.BASE_PATH}/undraw_add_document_re_mbjx.svg`}
    alt="blank document"
  />
);

export const TermsDocumentIllustration = () => (
  //TODO: fill the alt attribute
  <Illustration src={`${config.BASE_PATH}/undraw_Terms_re_6ak4.svg`} alt="" />
);

export const WelcomeIllustration = ({ height = '100%' }) => (
  <Illustration
    src={`${config.BASE_PATH}/undraw_apartment_rent_o0ut.svg`}
    height={height}
    alt="welcome"
  />
);

export const CelebrationIllustration = ({ label, height = '100%' }) => (
  <Illustration
    src={`${config.BASE_PATH}/undraw_Celebration_re_kc9k.svg`}
    height={height}
    label={label}
    alt="celebration"
  />
);
