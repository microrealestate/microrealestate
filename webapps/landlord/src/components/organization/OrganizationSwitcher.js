import { useCallback, useContext, useMemo } from 'react';

import config from '../../config';
import LocationCityIcon from '@material-ui/icons/LocationCity';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../store';
import ToggleMenu from '../ToggleMenu';

const OrganizationSwitcher = observer(() => {
  const store = useContext(StoreContext);

  const handleChange = useCallback(
    ([{ id }]) => {
      if (store.organization.selected?._id !== id) {
        const organization = store.organization.items.find(
          ({ _id }) => _id === id
        );
        window.location.assign(
          `${config.BASE_PATH}/${organization.locale}/${organization.name}/dashboard`
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
    () => options.find(({ id }) => id === store.organization.selected._id)?.id,
    [options, store.organization.selected]
  );

  return store.organization?.items?.length > 0 ? (
    <ToggleMenu
      startIcon={<LocationCityIcon />}
      options={options}
      selectedIds={value ? [value] : []}
      onChange={handleChange}
    />
  ) : null;
});

export default OrganizationSwitcher;
