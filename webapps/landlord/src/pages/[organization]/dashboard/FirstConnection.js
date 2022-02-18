import React, { useMemo } from 'react';

import { Box } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Step from '@material-ui/core/Step';
import StepContent from '@material-ui/core/StepContent';
import StepLabel from '@material-ui/core/StepLabel';
import Stepper from '@material-ui/core/Stepper';
import Typography from '@material-ui/core/Typography';
import useTranslation from 'next-translate/useTranslation';

export default function FirstConnection({
  hasContract,
  hasProperty,
  hasTenant,
  handleCreateContract,
  handleCreateProperty,
  handleCreateTenant,
}) {
  const { t } = useTranslation('common');
  const [activeStep] = React.useState(
    hasContract ? (hasProperty ? (hasTenant ? 3 : 2) : 1) : 0
  );
  const steps = useMemo(() => {
    return [
      {
        key: 0,
        label: t('Create your first contract'),
        content: '',
        onClick: handleCreateContract,
      },
      {
        key: 1,
        label: t('Add your first property'),
        content: '',
        onClick: handleCreateProperty,
      },
      {
        key: 2,
        label: t('Add your first tenant'),
        content: '',
        onClick: handleCreateTenant,
      },
    ];
  }, [
    //t,
    handleCreateContract,
    handleCreateProperty,
    handleCreateTenant,
  ]);

  return (
    <>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map(({ key, label, content, onClick }) => (
          <Step key={key}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              <Typography>{content}</Typography>
              <Box mt={2} mb={1}>
                <Button variant="contained" color="primary" onClick={onClick}>
                  {key > 0 ? t('Add') : t('Create')}
                </Button>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </>
  );
}
