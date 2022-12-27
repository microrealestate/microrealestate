import { forwardRef } from 'react';
import { Slide } from '@material-ui/core';

export default forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});
