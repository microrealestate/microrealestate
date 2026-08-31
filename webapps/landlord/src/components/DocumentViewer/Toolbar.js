import { Button } from '@microrealestate/commonui/components/ui/button';
import { cn } from '@microrealestate/commonui/utils';
import { LuRotateCcw, LuRotateCw, LuZoomIn, LuZoomOut } from 'react-icons/lu';

export default function Toolbar({
  onZoomIn,
  onZoomOut,
  onRotateLeft,
  onRotateRight,

  className
}) {
  return (
    <div
      className={cn(
        'flex justify-end gap-2 p-1 bg-card text-card-foreground mb-1',
        className
      )}
    >
      <Button variant="ghost" size="icon" onClick={onZoomIn}>
        <LuZoomIn className="size-6" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onZoomOut}>
        <LuZoomOut className="size-6" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onRotateLeft}>
        <LuRotateCcw className="size-6" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onRotateRight}>
        <LuRotateCw className="size-6" />
      </Button>
    </div>
  );
}
