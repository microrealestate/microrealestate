import { useState } from 'react';

export default function useDialog(DialogComponent) {
  const [open, setOpen] = useState(false);

  const Dialog = (props) => {
    return <DialogComponent {...props} open={open} setOpen={setOpen} />;
  };

  return [Dialog, setOpen, open];
}
