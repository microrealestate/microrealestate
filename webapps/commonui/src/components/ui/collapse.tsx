import { Collapsible } from '@radix-ui/react-collapsible';
import { LuChevronsUpDown } from 'react-icons/lu';
import { Button } from './button';
import { Card } from './card';
import { CollapsibleContent, CollapsibleTrigger } from './collapsible';

interface CollapseProps {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}
export function Collapse({
  title,
  open,
  onOpenChange,
  className,
  children
}: React.PropsWithChildren<CollapseProps>) {
  return (
    <Card className="p-1">
      <Collapsible
        open={open}
        onOpenChange={onOpenChange}
        className={className}
      >
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="flex w-full">
              <div className="grow text-lg text-left pl-2">{title}</div>
              <LuChevronsUpDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="px-5 pb-5">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
