import type { Editor } from '@tiptap/react';
import { useMediaQuery } from 'usehooks-ts';
import DesktopToolbar from './toolbar/DesktopToolbar';
import MobileToolbar from './toolbar/MobileToolbar';

export default function FormatMenu(props: {
  editor: Editor;
  editable: boolean;
  showPrintButton?: boolean;
}) {
  const isWide = useMediaQuery('(min-width: 768px)');
  return isWide ? <DesktopToolbar {...props} /> : <MobileToolbar {...props} />;
}
