import { Slide, useScrollTrigger } from '@material-ui/core';
import { cloneElement, memo } from 'react';

export const ElevationScroll = memo(function ElevationScroll({ children }) {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
  });

  return cloneElement(children, {
    elevation: trigger ? 4 : 0,
    style: !trigger
      ? {
          backgroundColor: 'transparent',
        }
      : null,
  });
});

export const HideOnScroll = memo(function HideOnScroll({ children }) {
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
});
