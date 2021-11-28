import { useCallback, useContext, useMemo } from 'react';

import getConfig from 'next/config';
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
      const organization = store.organization.items.find(
        ({ _id }) => _id === id
      );
      window.location.assign(
        `${BASE_PATH}/${organization.locale}/${organization.name}/dashboard`
      );
    },
    [store.organization.items]
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

  return (
    <ToggleMenu
      startIcon={<LocationCityIcon />}
      options={options}
      value={value}
      onChange={onChange}
    />
  );
});

export default OrganizationSwitcher;
