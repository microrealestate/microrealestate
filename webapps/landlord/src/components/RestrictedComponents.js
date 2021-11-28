import { Button, IconButton, Tooltip } from '@material-ui/core';
import { useContext, useMemo } from 'react';

import { StoreContext } from '../store';
import useTranslation from 'next-translate/useTranslation';

export function RestrictedComponent(Component) {
  return function RestrictedComponent({
    onlyRoles,
    disabled,
    disabledTooltipTitle = '',
    children,
    ...props
  }) {
    const { t } = useTranslation('common');
    const store = useContext(StoreContext);
    const isNotAllowed = useMemo(
      () =>
        onlyRoles && store.user.role
          ? !onlyRoles.includes(store.user.role)
          : false,
      [onlyRoles, store.user.role]
    );

    return isNotAllowed ? (
      <Tooltip
        title={t('Action is not allowed with your current role')}
        aria-label="Action is not allowed with your current role"
      >
        <span>
          <Component {...props} disabled={true}>
            {children}
          </Component>
        </span>
      </Tooltip>
    ) : disabled ? (
      <Tooltip title={disabledTooltipTitle} aria-label="restricted action">
        <span>
          <Component {...props} disabled={disabled}>
            {children}
          </Component>
        </span>
      </Tooltip>
    ) : (
      <Component {...props}>{children}</Component>
    );
  };
}

export const RestrictButton = RestrictedComponent(Button);

export const RestrictIconButton = RestrictedComponent(IconButton);
