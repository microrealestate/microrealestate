import { cn } from '../utils';
import { LuCheck } from 'react-icons/lu';
import React from 'react';

export function Step({
  stepLabel,
  index,
  isDone,
  isLast,
  children,
  className
}) {
  return (
    <div className="flex gap-2 items-stretch">
      <div className="flex flex-col items-center">
        {isDone ? (
          <div className="flex justify-center items-center rounded-full bg-success text-success-foreground size-6">
            <LuCheck className="size-4" />
          </div>
        ) : null}
        {!isDone ? (
          <div className="flex justify-center items-center rounded-full bg-primary text-primary-foreground size-6">
            <div className="text-sm font-medium">{index + 1}</div>
          </div>
        ) : null}

        <div
          className={cn(
            'flex-grow w-[1px] mt-1',
            !isLast || !isDone ? 'border-r' : ''
          )}
        />
      </div>
      <div className="flex flex-col">
        <div className="pb-2">{stepLabel}</div>
        <div className="flex gap-2 pb-6">
          {isDone ? null : <div className={className}>{children}</div>}
        </div>
      </div>
    </div>
  );
}

export function Stepper({ activeStep, children }) {
  return (
    <div className="flex flex-col gap-1">
      {React.Children.map(children, (child, index) => {
        return React.cloneElement(child, {
          index,
          isDone: activeStep > index || child.props.isDone,
          isLast: index === React.Children.count(children) - 1
        });
      })}
    </div>
  );
}
