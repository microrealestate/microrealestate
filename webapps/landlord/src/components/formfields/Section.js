import { Separator } from '../ui/separator';
import { SwitchField } from './SwitchField';

export function Section({
  label,
  description,
  visible = true,
  withSwitch = false,
  switchName,
  className,
  children
}) {
  return (
    <div className="pb-10">
      {visible ? (
        <>
          <div className="flex justify-between">
            <div className="text-xl">{label}</div>
            {withSwitch ? <SwitchField name={switchName} /> : null}
          </div>

          {description ? (
            <div className="text-muted-foreground text-sm">{description}</div>
          ) : null}

          <Separator className="mt-1 mb-2" />

          {className ? <div className={className}>{children}</div> : children}
        </>
      ) : (
        children
      )}
    </div>
  );
}
