import { useEffect, useState } from 'react';

import { isServer } from '@microrealestate/commonui/utils';
import { useTheme } from '@material-ui/core';

function getCurrentBreakpoint(theme) {
  let breakpoint;
  if (window.innerWidth < theme.breakpoints.values.sm) {
    breakpoint = 'xs';
  } else if (
    window.innerWidth >= theme.breakpoints.values.sm &&
    window.innerWidth < theme.breakpoints.values.md
  ) {
    breakpoint = 'sm';
  } else if (
    window.innerWidth >= theme.breakpoints.values.md &&
    window.innerWidth < theme.breakpoints.values.lg
  ) {
    breakpoint = 'md';
  } else if (
    window.innerWidth >= theme.breakpoints.values.lg &&
    window.innerWidth < theme.breakpoints.values.xl
  ) {
    breakpoint = 'lg';
  } else {
    breakpoint = 'xl';
  }

  return breakpoint;
}

function getHiddenBreakpoints({
  lgDown,
  lgUp,
  mdDown,
  mdUp,
  only,
  smDown,
  smUp,
  xlDown,
  xlUp,
  xsDown,
  xsUp,
}) {
  if (only) {
    return only;
  }

  if (xlDown) {
    return ['xs', 'sm', 'md', 'lg', 'xl'];
  }

  if (lgDown) {
    return ['xs', 'sm', 'md', 'lg'];
  }

  if (mdDown) {
    return ['xs', 'sm', 'md'];
  }

  if (smDown) {
    return ['xs', 'sm'];
  }

  if (xsDown) {
    return ['xs'];
  }

  if (xlUp) {
    return ['xl'];
  }

  if (lgUp) {
    return ['lg', 'xl'];
  }

  if (mdUp) {
    return ['md', 'lg', 'xl'];
  }

  if (smUp) {
    return ['sm', 'md', 'lg', 'xl'];
  }

  if (xsUp) {
    return ['xs', 'sm', 'md', 'lg', 'xl'];
  }

  return [];
}

export default function Hidden({ children, ...props }) {
  const theme = useTheme();
  const [breakpoint, setBreakpoint] = useState(getCurrentBreakpoint(theme));
  const hiddenBreakpoints = getHiddenBreakpoints(props);

  useEffect(() => {
    if (!isServer()) {
      const onResize = () => {
        setBreakpoint(getCurrentBreakpoint(theme));
      };
      onResize();
      addEventListener('resize', onResize);

      return () => {
        removeEventListener('resize', onResize);
      };
    }
  }, [
    theme,
    theme.breakpoints.values.lg,
    theme.breakpoints.values.md,
    theme.breakpoints.values.sm,
    theme.breakpoints.values.xl,
    theme.breakpoints.values.xs,
  ]);

  return isServer() || !hiddenBreakpoints.includes(breakpoint)
    ? children
    : null;
}
