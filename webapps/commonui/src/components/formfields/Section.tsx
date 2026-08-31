import { cn } from '../../utils';
import { SwitchField } from './SwitchField';

type SectionProps = {
  label: string;
  description?: string;
  visible?: boolean;
  className?: string;
} & (
  | { withSwitch: true; switchName: string }
  | { withSwitch?: false; switchName?: undefined }
);

export function Section({
  label,
  description,
  visible = true,
  withSwitch = false,
  switchName,
  className,
  children
}: React.PropsWithChildren<SectionProps>) {
  return (
    <div className="pb-10 last:pb-0">
      {visible ? (
        <>
          <div className="flex justify-between">
            <div className="text-xl">{label}</div>
            {withSwitch ? <SwitchField name={switchName ?? ''} /> : null}
          </div>

          {description ? (
            <div className="text-muted-foreground text-sm">{description}</div>
          ) : null}

          <div className={cn('mt-4 space-y-4', className)}>{children}</div>
        </>
      ) : (
        <div className={cn('space-y-4', className)}>{children}</div>
      )}
    </div>
  );
}
