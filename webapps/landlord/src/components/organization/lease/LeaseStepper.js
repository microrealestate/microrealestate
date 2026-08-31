import {
  Step,
  StepContent,
  StepLabel,
  Stepper
} from '@microrealestate/commonui/components/ui/stepper';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useStore } from '@/providers/StoreProvider';
import { useNav } from '../../../providers/NavProvider';
import LeaseForm, { validate as LeaseFormValidate } from './LeaseForm';
import TemplateForm from './TemplateForm';

export default function LeaseStepper({ onSubmit }) {
  const store = useStore();
  const t = useTranslations('common');
  const { goBack } = useNav();
  const [activeStep, setActiveStep] = useState(0);
  const [validSteps, setValidSteps] = useState([false, false]);

  useEffect(() => {
    const checkFormsValid = async () => {
      try {
        await LeaseFormValidate(store.lease?.selected, store.lease?.items);
        setValidSteps([true, false]);
      } catch (error) {
        console.log(error);
        setValidSteps([false, false]);
      }
    };

    checkFormsValid();
  }, [store.lease?.items, store.lease?.selected]);

  const handleSubmit = async (leasePart = {}) => {
    try {
      await onSubmit({ ...leasePart, stepperMode: true });
      setValidSteps([true, false]);
      setActiveStep(activeStep + 1);
    } catch (_error) {
      // do nothing on error
    }
  };

  const handleEnd = async () => {
    try {
      await onSubmit({ stepperMode: false });
      setValidSteps([true, true]);
      goBack();
    } catch (_error) {
      // do nothing on error
    }
  };

  const handleStepperChange = (stepIndex) => {
    setActiveStep(stepIndex);
  };

  return (
    <Stepper
      activeStep={activeStep}
      validSteps={validSteps}
      onChange={handleStepperChange}
    >
      <Step>
        <StepLabel>{t('Contract information')}</StepLabel>
        <StepContent>
          <LeaseForm onSubmit={handleSubmit} />
        </StepContent>
      </Step>
      <Step>
        <StepLabel>{t('Template documents')}</StepLabel>
        <StepContent>
          <TemplateForm onSubmit={handleEnd} />
        </StepContent>
      </Step>
    </Stepper>
  );
}
