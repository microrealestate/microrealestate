import { useCallback, useContext, useState } from 'react';

import BillingForm from './forms/BillingForm';
import { validate as BillingFormValidate } from '../../components/tenants/forms/BillingForm';
import { Box } from '@material-ui/core';
import DocumentsForm from './forms/DocumentsForm';
import LeaseContractForm from './forms/LeaseContractForm';
import { validate as LeaseContractFormValidate } from '../../components/tenants/forms/LeaseContractForm';
import Step from '@material-ui/core/Step';
import StepContent from '@material-ui/core/StepContent';
import StepLabel from '@material-ui/core/StepLabel';
import Stepper from '@material-ui/core/Stepper';
import { StoreContext } from '../../store';
import TenantForm from './forms/TenantForm';
import { validate as TenantFormValidate } from '../../components/tenants/forms/TenantForm';
import { useComponentMountedRef } from '../../utils/hooks';
import useTranslation from 'next-translate/useTranslation';

export default function TenantStepper({ onSubmit }) {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  const [activeStep, setActiveStep] = useState(0);
  const mountedRef = useComponentMountedRef();

  const handleSubmit = useCallback(
    async (tenantPart) => {
      try {
        let isFormsValid = false;
        try {
          await TenantFormValidate(store.tenant?.selected);
          await LeaseContractFormValidate(store.tenant?.selected);
          await BillingFormValidate(store.tenant?.selected);
          isFormsValid = activeStep >= 3;
        } catch (error) {
          console.log(error);
          isFormsValid = false;
        }
        await onSubmit({ ...tenantPart, stepperMode: !isFormsValid });
        if (mountedRef.current) {
          setActiveStep(activeStep + 1);
        }
      } catch (error) {
        // do nothing on error
      }
    },
    [onSubmit, mountedRef, store.tenant?.selected, activeStep]
  );

  return (
    <Stepper activeStep={activeStep} orientation="vertical">
      <Step>
        <StepLabel>{t('Tenant information')}</StepLabel>
        <StepContent>
          <Box px={1}>
            <TenantForm onSubmit={handleSubmit} />
          </Box>
        </StepContent>
      </Step>
      <Step>
        <StepLabel>{t('Lease')}</StepLabel>
        <StepContent>
          <Box px={1}>
            <LeaseContractForm onSubmit={handleSubmit} />
          </Box>
        </StepContent>
      </Step>
      <Step>
        <StepLabel>{t('Billing information')}</StepLabel>
        <StepContent>
          <Box px={1}>
            <BillingForm onSubmit={handleSubmit} />
          </Box>
        </StepContent>
      </Step>
      <Step>
        <StepLabel>{t('Documents')}</StepLabel>
        <StepContent>
          <Box px={1}>
            <DocumentsForm onSubmit={handleSubmit} />
          </Box>
        </StepContent>
      </Step>
    </Stepper>
  );
}
