import {
  Step,
  StepContent,
  StepLabel,
  Stepper
} from '@microrealestate/commonui/components/ui/stepper';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useStore } from '@/providers/StoreProvider';
import { useNav } from '../../providers/NavProvider';
import BillingForm, {
  validate as BillingFormValidate
} from './forms/BillingForm';
import DocumentsForm from './forms/DocumentsForm';
import LeaseContractForm, {
  validate as LeaseContractFormValidate
} from './forms/LeaseContractForm';
import TenantForm, { validate as TenantFormValidate } from './forms/TenantForm';

export default function TenantStepper({ onSubmit }) {
  const store = useStore();
  const t = useTranslations('common');
  const { goBack } = useNav();
  const [activeStep, setActiveStep] = useState(0);
  const [validSteps, setValidSteps] = useState([false, false, false, false]);

  useEffect(() => {
    const checkFormsValid = async () => {
      try {
        await TenantFormValidate(store.tenant?.selected);
        setValidSteps([true, false, false, false]);
        await LeaseContractFormValidate(store.tenant?.selected);
        setValidSteps([true, true, false, false]);
        await BillingFormValidate(store.tenant?.selected);
        setValidSteps([true, true, true, false]);
      } catch (error) {
        console.log(error);
      }
    };

    checkFormsValid();
  }, [store.tenant?.selected]);

  const handleSubmit = async (tenantPart) => {
    try {
      await onSubmit({ ...tenantPart, stepperMode: true });
      setActiveStep(activeStep + 1);
    } catch (_error) {
      // do nothing on error
    }
  };

  const handleEnd = async () => {
    try {
      await onSubmit({ stepperMode: false });
      setValidSteps([true, true, true, true]);
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
        <StepLabel>{t('Tenant information')}</StepLabel>
        <StepContent>
          <TenantForm onSubmit={handleSubmit} />
        </StepContent>
      </Step>
      <Step>
        <StepLabel>{t('Lease')}</StepLabel>
        <StepContent>
          <LeaseContractForm onSubmit={handleSubmit} />
        </StepContent>
      </Step>
      <Step>
        <StepLabel>{t('Billing information')}</StepLabel>
        <StepContent>
          <BillingForm onSubmit={handleSubmit} />
        </StepContent>
      </Step>
      <Step>
        <StepLabel>{t('Documents')}</StepLabel>
        <StepContent>
          <DocumentsForm onSubmit={handleEnd} />
        </StepContent>
      </Step>
    </Stepper>
  );
}
