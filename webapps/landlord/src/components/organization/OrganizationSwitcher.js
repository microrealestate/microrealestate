import { useCallback, useContext, useMemo } from 'react';

import getConfig from 'next/config';
import { Hidden } from '@material-ui/core';
import LocationCityIcon from '@material-ui/icons/LocationCity';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../store';
import ToggleMenu from '../ToggleMenu';

const {
  publicRuntimeConfig: { BASE_PATH },
} = getConfig();

const OrganizationSwitcher = observer(() => {
  const store = useContext(StoreContext);

  const onChange = useCallback(
    ({ id }) => {
      if (store.organization.selected?._id !== id) {
        const organization = store.organization.items.find(
          ({ _id }) => _id === id
        );
        window.location.assign(
          `${BASE_PATH}/${organization.locale}/${organization.name}/dashboard`
        );
      }
    },
    [store.organization.selected, store.organization.items]
  );

  const options = useMemo(
    () =>
      store.organization.items.map(({ _id, name }) => ({
        id: _id,
        label: name,
      })),
    [store.organization.items]
  );

  const value = useMemo(
    () => options.find(({ id }) => id === store.organization.selected._id),
    [options, store.organization.selected]
  );

  return store.organization?.items?.length > 0 ? (
    <>
      <Hidden smDown>
        <ToggleMenu
          startIcon={<LocationCityIcon />}
          options={options}
          value={value}
          noLabel={false}
          onChange={onChange}
        />
      </Hidden>
      <Hidden mdUp>
        <ToggleMenu
          startIcon={<LocationCityIcon />}
          options={options}
          value={value}
          noLabel={true}
          onChange={onChange}
        />
      </Hidden>
    </>
  ) : null;
});

export default OrganizationSwitcher;
