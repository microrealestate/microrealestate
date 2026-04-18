import { useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { toast } from 'sonner';

import { withAuthentication } from '../../../components/Authentication';
import Page from '../../../components/Page';
import RentReportCard from '../../../components/reports/RentReportCard';
import {
  loadCityRentRanges,
  mergeCityRentRanges
} from '../../../components/properties/CityEstimatesCard';
import { apiFetcher } from '../../../utils/fetch';
import { StoreContext } from '../../../store';

function RentReportPage() {
  const store = useContext(StoreContext);
  const organizationName = store.organization.selected?.name;
  const [cityRentEstimates, setCityRentEstimates] = useState(() =>
    mergeCityRentRanges()
  );
  const [cityList, setCityList] = useState([]);
  const [properties, setProperties] = useState([]);
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
      try {
        const response = await apiFetcher().get('/properties');
        const nextProperties = response.data || [];
        setProperties(nextProperties);

        if (!isMounted) {
          return;
        }

        const cities = [
          ...new Set(
            nextProperties
              .map((property) => property?.address?.city?.trim())
              .filter(Boolean)
          )
        ].sort((firstCity, secondCity) => firstCity.localeCompare(secondCity));

        setCityList(cities);
        setCityRentEstimates((previousRanges) =>
          mergeCityRentRanges(previousRanges, cities)
        );
      } catch {
        toast.error('Unable to load properties for rent report');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPropertyCities();

    return () => {
      isMounted = false;
    };
  }, [organizationName]);

  return (
    <Page title="Rent report" loading={loading}>
      <RentReportCard
        cityList={cityList}
        cityRentEstimates={cityRentEstimates}
        properties={properties}
      />
    </Page>
  );
}

export default withAuthentication(observer(RentReportPage));