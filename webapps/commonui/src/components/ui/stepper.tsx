import React, {
  createContext,
  type ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { LuCheck } from 'react-icons/lu';
import { cn } from '../../utils';
import { Button } from './button';

const StepperContext = createContext<{
  activeStep: number;
  displayedStep: number;
  validSteps?: boolean[];
  countSteps: number;
  setActiveStep?: (step: number) => void;
  onStepTransitionEnd?: () => void;
  hideContentWhenValidated: boolean;
  allowStepNavigation: boolean;
}>({
  activeStep: 0,
  displayedStep: 0,
  countSteps: 0,
  hideContentWhenValidated: true,
  allowStepNavigation: true
});

interface StepProps {
  index: number;
}

interface StepContentProps {
  index: number;
}

interface StepperProps {
  activeStep: number;
  validSteps?: boolean[];
  hideContentWhenValidated?: boolean;
  allowStepNavigation?: boolean;
  onChange: (step: number) => void;
}

export function Stepper({
  activeStep,
  validSteps,
  hideContentWhenValidated = true,
  allowStepNavigation = true,
  onChange: setActiveStep,
  children
}: React.PropsWithChildren<StepperProps>) {
  const [displayedStep, setDisplayedStep] = useState(activeStep);
  const prevActiveStep = useRef(activeStep);

  useEffect(() => {
    if (activeStep !== prevActiveStep.current) {
      if (hideContentWhenValidated) {
        // Phase 1: close the current step (set displayedStep to -1)
        setDisplayedStep(-1);
      } else {
        // No close animation needed, old step stays open
        setDisplayedStep(activeStep);
      }
      prevActiveStep.current = activeStep;
    }
  }, [activeStep, hideContentWhenValidated]);

  const onStepTransitionEnd = useCallback(() => {
    // Phase 2: after close transition ends, open the new step
    if (displayedStep === -1) {
      setDisplayedStep(activeStep);
    }
  }, [displayedStep, activeStep]);

  const steps = useMemo(() => {
    return React.Children.map(children, (child, index) => {
      if (!React.isValidElement(child)) {
        return null;
      }
      if (child.type !== Step) {
        return child;
      }
      const stepChild = child as ReactElement<StepProps>;
      return React.cloneElement(stepChild, {
        index
      });
    });
  }, [children]);

  const stepperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeStep > 0) {
      stepperRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [activeStep]);

  return (
    <StepperContext.Provider
      value={{
        activeStep,
        displayedStep,
        validSteps,
        setActiveStep,
        onStepTransitionEnd,
        countSteps: steps?.length || 0,
        hideContentWhenValidated,
        allowStepNavigation: hideContentWhenValidated && allowStepNavigation
      }}
    >
      <div ref={stepperRef} className="scroll-mt-24 space-y-8 p-4">
        {steps}
      </div>
    </StepperContext.Provider>
  );
}

export function Step({ index, children }: React.PropsWithChildren<StepProps>) {
  const { displayedStep, validSteps, hideContentWhenValidated } =
    useContext(StepperContext);
  const isActive = displayedStep === index;
  const isValidated =
    validSteps && validSteps.length > index
      ? validSteps[index]
      : displayedStep > index;
  const content = useMemo(() => {
    return React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) {
        return null;
      }

      if (child.type === StepLabel) {
        const stepLabelChild = child as ReactElement<StepProps>;
        return React.cloneElement(stepLabelChild, { index });
      }

      if (child.type === StepContent) {
        const stepContentChild = child as ReactElement<StepContentProps>;
        return React.cloneElement(stepContentChild, { index });
      }
      return child;
    });
  }, [children, index]);
  return (
    <div className="relative space-y-4">
      {content}
      {isActive || (isValidated && !hideContentWhenValidated) ? (
        <div className="absolute top-[2rem] left-[0.75rem] bottom-0 border border-t-0 border-r-0 border-b-0 border-l"></div>
      ) : null}
    </div>
  );
}

export function StepLabel({
  index,
  children
}: React.PropsWithChildren<StepProps>) {
  const { activeStep, setActiveStep, validSteps, allowStepNavigation } =
    useContext(StepperContext);
  const isValidated =
    validSteps && validSteps.length > index
      ? validSteps[index]
      : activeStep && activeStep > index;
  const isActive = activeStep === index;
  const isClickable = isValidated && allowStepNavigation && !isActive;

  const handleClick = () => {
    if (isClickable) {
      setActiveStep?.(index);
    }
  };

  return (
    <div className="flex gap-3">
      <Button
        variant={isActive ? 'default' : 'secondary'}
        disabled={!isActive}
        className={cn(
          'rounded-full size-6 opacity-100! pointer-events-none',
          'border-none shadow-none m-0 p-0 font-semibold cursor-default',
          isValidated && 'bg-success text-success-foreground'
        )}
      >
        <div className="size-6 flex justify-center items-center">
          {isValidated ? <LuCheck /> : index + 1}
        </div>
      </Button>
      {isClickable ? (
        <Button variant="link" className="p-0 h-auto" onClick={handleClick}>
          {children}
        </Button>
      ) : (
        children
      )}
    </div>
  );
}

export function StepContent({
  index,
  children
}: React.PropsWithChildren<StepContentProps>) {
  const {
    displayedStep,
    hideContentWhenValidated,
    validSteps,
    onStepTransitionEnd
  } = useContext(StepperContext);
  const isActive = displayedStep === index;
  const isValidated =
    validSteps && validSteps.length > index
      ? validSteps[index]
      : displayedStep > index;

  const isOpen = isActive || (isValidated && !hideContentWhenValidated);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(isOpen);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Make visible first with grid-rows-[0fr], then expand on next frame
      setIsVisible(true);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    // Only react to our own grid-template-rows transition, not children
    if (e.target === e.currentTarget && !isOpen) {
      setIsVisible(false);
      onStepTransitionEnd?.();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        'grid transition-[grid-template-rows] duration-600 ease-in-out',
        isAnimating ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      )}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="overflow-hidden p-2 -m-2">
        <div className="pb-2 ml-8">{children}</div>
      </div>
    </div>
  );
}
