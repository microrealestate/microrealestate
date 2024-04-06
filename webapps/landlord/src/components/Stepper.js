import { CheckIcon } from 'lucide-react';
import { cn } from '../utils';
import React from 'react';

export function Step({ stepLabel, index, isDone, isLast, children }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {isDone ? (
          <div className="relative rounded-full bg-success text-success-foreground h-8 w-8">
            <CheckIcon size={16} className="absolute top-2 left-2" />
          </div>
        ) : (
          <div className="flex justify-center items-center rounded-full bg-primary text-primary-foreground h-8 w-8">
            <span>{index + 1}</span>
          </div>
        )}
        {stepLabel}
      </div>
      <div className="flex gap-2">
        <div
          className={cn(
            'ml-3 mt-2 min-h-4 min-w-1',
            !isLast || !isDone ? 'border-r' : ''
          )}
        />
        {isDone ? null : <div className="mt-4 mb-2">{children}</div>}
      </div>
    </div>
  );
}

export function Stepper({ activeStep, children }) {
  return (
    <div className="flex flex-col gap-2">
      {React.Children.map(children, (child, index) => {
        return React.cloneElement(child, {
          index,
          isDone: activeStep > index,
          isLast: index === React.Children.count(children) - 1
        });
      })}
    </div>
  );
}
