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
        stepLabel: t(
          'Create a reusable contract model that includes the terms and conditions for renting your properties.'
        ),
        buttonLabel: t('Create a contract'),
        onClick: handleCreateContract,
        isDone: hasContract,
        dataCy: 'shortcutCreateContract'
      },
      {
        key: 1,
        stepLabel: t(
          'Enter the details of your property so it can be listed and made available for renting.'
        ),
        buttonLabel: t('Add a property'),
        onClick: handleAddProperty,
        isDone: hasProperty,
        dataCy: 'shortcutAddProperty'
      },
      {
        key: 2,
        stepLabel: t(
          "Add your tenant's details to link them to the property and contract model, finalizing the lease setup."
        ),
        buttonLabel: t('Add a tenant'),
        onClick: handleAddTenant,
        isDone: hasTenant,
        dataCy: 'shortcutAddTenant'
      }
    ];
  }, [
    t,
    handleCreateContract,
    hasContract,
    handleAddProperty,
    hasProperty,
    handleAddTenant,
    hasTenant
  ]);

  return (
    <div>
      <div className="mb-8 text-xl">
        {t('Follow these steps to start managing your properties')}
      </div>
      <Stepper activeStep={activeStep}>
        {steps.map(
          ({ key, stepLabel, buttonLabel, onClick, dataCy, isDone }) => {
            return (
              <Step
                key={key}
                stepLabel={stepLabel}
                isDone={isDone}
                className="p-4"
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onClick}
                  className="w-52"
                  data-cy={dataCy}
                >
                  {buttonLabel}
                </Button>
              </Step>
            );
          }
        )}
      </Stepper>
    </div>
  );
}
