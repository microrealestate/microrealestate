import LeaseForm, { validate as LeaseFormValidate } from './LeaseForm';
import { useCallback, useContext, useState } from 'react';

import { Box } from '@material-ui/core';
import Step from '@material-ui/core/Step';
import StepContent from '@material-ui/core/StepContent';
import StepLabel from '@material-ui/core/StepLabel';
import Stepper from '@material-ui/core/Stepper';
import { StoreContext } from '../../../store';
import TemplateForm from './TemplateForm';
import useTranslation from 'next-translate/useTranslation';

export default function LeaseStepper({ onSubmit }) {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  const [activeStep, setActiveStep] = useState(0);

  const handleSubmit = useCallback(
    async (leasePart = {}) => {
      try {
        let isFormsValid = false;
        try {
          await LeaseFormValidate(store.lease?.selected, store.lease?.items);
          isFormsValid = activeStep >= 1;
        } catch (error) {
          console.log(error);
          isFormsValid = false;
        }
        await onSubmit({ ...leasePart, stepperMode: !isFormsValid });

        setActiveStep(activeStep + 1);
      } catch (error) {
        // do nothing on error
      }
    },
    [onSubmit, store.lease?.selected, store.lease?.items, activeStep]
  );

  return (
    <Stepper activeStep={activeStep} orientation="vertical">
      <Step>
        <StepLabel>{t('Contract information')}</StepLabel>
        <StepContent>
          <Box px={1}>
            <LeaseForm onSubmit={handleSubmit} />
          </Box>
        </StepContent>
      </Step>
      <Step>
        <StepLabel>{t('Template documents')}</StepLabel>
        <StepContent>
          <Box px={1}>
            <TemplateForm onSubmit={handleSubmit} />
          </Box>
        </StepContent>
      </Step>
    </Stepper>
  );
}
