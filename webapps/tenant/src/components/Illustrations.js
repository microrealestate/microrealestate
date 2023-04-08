import { Illustration } from '@microrealestate/commonui/components';

export const UnderConstructionIllustration = () => {
  return (
    <Illustration
      src={`${process.env_NEXT_PUBLIC_BASE_PATH}/undraw_qa_engineers_dg-5-p.svg`}
      label="Work in progress"
      alt="Work in progress"
    />
  );
};
