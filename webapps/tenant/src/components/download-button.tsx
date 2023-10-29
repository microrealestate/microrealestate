import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function DownLoadButton() {
  return (
    <Button variant="ghost">
      <Download className="h-4 w-4" />
    </Button>
  );
}
