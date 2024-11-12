import {
  Tooltip as SCNTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from './ui/tooltip';

export default function Tooltip({ title, children }) {
  return (
    <TooltipProvider>
      <SCNTooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>
          <p>{title}</p>
        </TooltipContent>
      </SCNTooltip>
    </TooltipProvider>
  );
}
