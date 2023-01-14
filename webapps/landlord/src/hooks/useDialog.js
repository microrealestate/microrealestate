import { useState } from 'react';

export default function useDialog(DialogComponent) {
  const [open, setOpen] = useState(false);

  const Dialog = (props) => {
    return open ? (
      <DialogComponent {...props} open={open} setOpen={setOpen} />
    ) : null;
  };

  return [Dialog, setOpen, open];
}
