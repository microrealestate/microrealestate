import getConfig from 'next/config';
import { Illustration } from '@microrealestate/commonui/components';

const {
  publicRuntimeConfig: { BASE_PATH },
} = getConfig();

export const UnderConstructionIllustration = () => {
  return (
    <Illustration
      src={`${BASE_PATH}/undraw_qa_engineers_dg-5-p.svg`}
      label="Work in progress"
      alt="Work in progress"
    />
  );
};
