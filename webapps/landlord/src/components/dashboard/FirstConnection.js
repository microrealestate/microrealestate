import React, { useMemo } from 'react';
import { Step, Stepper } from '../Stepper';
import { Button } from '../ui/button';
import useTranslation from 'next-translate/useTranslation';

export default function FirstConnection({
  hasContract,
  hasProperty,
  hasTenant,
  handleCreateContract,
  handleAddProperty,
  handleAddTenant
}) {
  const { t } = useTranslation('common');
  const [activeStep] = React.useState(
    hasContract ? (hasProperty ? (hasTenant ? 3 : 2) : 1) : 0
  );
  const steps = useMemo(() => {
    return [
      {
        key: 0,
        stepLabel: t('Create my first contract'),
        buttonLabel: t('Create'),
        onClick: handleCreateContract,
        dataCy: 'shortcutCreateContract'
      },
      {
        key: 1,
        stepLabel: t('Add my first property'),
        buttonLabel: t('Add'),
        onClick: handleAddProperty,
        dataCy: 'shortcutAddProperty'
      },
      {
        key: 2,
        stepLabel: t('Add my first tenant'),
        buttonLabel: t('Add'),
        onClick: handleAddTenant,
        dataCy: 'shortcutAddTenant'
      }
    ];
  }, [t, handleCreateContract, handleAddProperty, handleAddTenant]);

  return (
    <div>
      <div className="mb-8 text-xl">
        {t('Follow these steps to start managing your properties')}
      </div>
      <Stepper activeStep={activeStep}>
        {steps.map(({ key, stepLabel, buttonLabel, onClick, dataCy }) => {
          return (
            <Step key={key} stepLabel={stepLabel}>
              <Button
                variant="outline"
                onClick={onClick}
                data-cy={dataCy}
                className="w-52"
              >
                {buttonLabel}
              </Button>
            </Step>
          );
        })}
      </Stepper>
    </div>
  );
}
