import { useCallback, useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { toast } from 'sonner';
import { withAuthentication } from '../../../components/Authentication';
import CityEstimatesCard, {
  loadCityRentRanges,
  mergeCityRentRanges,
  saveCityRentRanges
} from '../../../components/properties/CityEstimatesCard';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import useTranslation from 'next-translate/useTranslation';

function RentEstimatesPage() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const organizationName = store.organization.selected?.name;
  const [cityRentEstimates, setCityRentEstimates] = useState(() =>
    mergeCityRentRanges()
  );
  const [cityList, setCityList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedRanges = loadCityRentRanges(organizationName);
    setCityRentEstimates((previousRanges) =>
      mergeCityRentRanges(storedRanges, Object.keys(previousRanges))
    );
  }, [organizationName]);

  useEffect(() => {
    let isMounted = true;

    const fetchPropertyCities = async () => {
      setLoading(true);
      const response = await store.property.fetch();
      if (!isMounted || response.status !== 200) {
        setLoading(false);
        return;
      }

      const cities = [
        ...new Set(
          (store.property.items || [])
            .map((property) => property?.address?.city?.trim())
            .filter(Boolean)
        )
      ].sort((firstCity, secondCity) => firstCity.localeCompare(secondCity));

      setCityList(cities);
      setCityRentEstimates((previousRanges) =>
        mergeCityRentRanges(previousRanges, cities)
      );
      setLoading(false);
    };

    fetchPropertyCities();

    return () => {
      isMounted = false;
    };
  }, [organizationName, store.property]);

  const onSaveCityRentEstimates = useCallback(
    (ranges) => {
      const mergedRanges = mergeCityRentRanges(ranges, cityList);
      setCityRentEstimates(mergedRanges);
      saveCityRentRanges(organizationName, mergedRanges);
      toast.success('City estimates saved');
    },
    [cityList, organizationName]
  );

  return (
    <Page title={t('City rent estimates')} loading={loading}>
      <CityEstimatesCard
        cityList={cityList}
        cityRentEstimates={cityRentEstimates}
        properties={store.property.items}
        onSave={onSaveCityRentEstimates}
      />
    </Page>
  );
}

export default withAuthentication(observer(RentEstimatesPage));
