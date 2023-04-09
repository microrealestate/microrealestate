import config from '../config';
import { Illustration } from '@microrealestate/commonui/components';

export const UnderConstructionIllustration = () => {
  return (
    <Illustration
      src={`${config.NEXT_PUBLIC_BASE_PATH}/undraw_qa_engineers_dg-5-p.svg`}
      label="Work in progress"
      alt="Work in progress"
    />
  );
};
