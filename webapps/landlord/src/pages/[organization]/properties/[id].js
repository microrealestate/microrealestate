import { LuArrowLeft, LuHistory, LuKeyRound, LuTrash } from 'react-icons/lu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../../../components/ui/tabs';
import { apiFetcher } from '../../../utils/fetch';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Card } from '../../../components/ui/card';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { DashboardCard } from '../../../components/dashboard/DashboardCard';
import Map from '../../../components/Map';
import moment from 'moment';
import NotesPanel from '../../../components/NotesPanel';
import NumberFormat from '../../../components/NumberFormat';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import PropertyForm from '../../../components/properties/PropertyForm';
import ShortcutButton from '../../../components/ShortcutButton';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import { toJS } from 'mobx';
import useFillStore from '../../../hooks/useFillStore';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

const DEFAULT_CITY_RENT_RANGE_BY_SQFT_YEAR = {
  Atlanta: { low: 22, medium: 29, high: 36 },
  Boston: { low: 35, medium: 45, high: 58 },
  Chicago: { low: 28, medium: 37, high: 48 },
  Dallas: { low: 24, medium: 31, high: 40 },
  'Los Angeles': { low: 38, medium: 50, high: 66 },
  Miami: { low: 42, medium: 55, high: 72 },
  'New York': { low: 48, medium: 62, high: 85 },
  'San Francisco': { low: 52, medium: 69, high: 92 },
  Seattle: { low: 34, medium: 44, high: 57 },
  Toronto: { low: 30, medium: 39, high: 50 }
};

const FALLBACK_CITY_RENT_RANGE = { low: 25, medium: 35, high: 45 };
const CITY_RENT_RANGE_STORAGE_KEY_PREFIX = 'mre.cityRentRangeBySqftYear';

function toValidNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeCityRange(range = {}, fallback = FALLBACK_CITY_RENT_RANGE) {
  return {
    low: toValidNumber(range.low, fallback.low),
    medium: toValidNumber(range.medium, fallback.medium),
    high: toValidNumber(range.high, fallback.high)
  };
}

function mergeCityRentRanges(customRanges = {}, cityList = []) {
  const mergedRanges = Object.entries(
    DEFAULT_CITY_RENT_RANGE_BY_SQFT_YEAR
  ).reduce((acc, [city, range]) => {
    acc[city] = normalizeCityRange(range);
    return acc;
  }, {});

  Object.entries(customRanges || {}).forEach(([city, range]) => {
    mergedRanges[city] = normalizeCityRange(
      range,
      mergedRanges[city] || FALLBACK_CITY_RENT_RANGE
    );
  });

  cityList.forEach((city) => {
    if (!mergedRanges[city]) {
      mergedRanges[city] = normalizeCityRange(
        DEFAULT_CITY_RENT_RANGE_BY_SQFT_YEAR[city],
        FALLBACK_CITY_RENT_RANGE
      );
    }
  });

  return mergedRanges;
}

function getStorageKey(organizationName) {
  return `${CITY_RENT_RANGE_STORAGE_KEY_PREFIX}.${organizationName || 'default'}`;
}

function loadCityRentRanges(organizationName) {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(organizationName));
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

function saveCityRentRanges(organizationName, ranges) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    getStorageKey(organizationName),
    JSON.stringify(ranges)
  );
}

function getPresetCity(city = '', cityRentRanges = {}) {
  const normalizedInput = city.trim().toLowerCase();
  return (
    Object.keys(cityRentRanges).find(
      (presetCity) => presetCity.toLowerCase() === normalizedInput
    ) || ''
  );
}

function getParentPropertyIdValue(parentPropertyId) {
  if (!parentPropertyId) {
    return null;
  }

  if (typeof parentPropertyId === 'object') {
    return parentPropertyId._id || null;
  }

  return parentPropertyId;
}

function getPropertySurfaceSqm(property, allProperties = []) {
  if (!property) {
    return 0;
  }

  const children = (allProperties || []).filter(
    (item) =>
      String(getParentPropertyIdValue(item?.parentPropertyId) || '') ===
      String(property._id || '')
  );

  const childrenSurface = children.reduce(
    (sum, child) => sum + (Number(child?.surface) || 0),
    0
  );

  if (childrenSurface > 0) {
    return childrenSurface;
  }

  return Number(property?.surface) || 0;
}

function pickRentValue(primaryValue, fallbackValue) {
  if (
    primaryValue !== null &&
    primaryValue !== undefined &&
    primaryValue !== ''
  ) {
    return primaryValue;
  }
  if (
    fallbackValue !== null &&
    fallbackValue !== undefined &&
    fallbackValue !== ''
  ) {
    return fallbackValue;
  }

  return '';
}

function CityEstimatesCard({
  cityList,
  cityRentEstimates,
  properties,
  onSave
}) {
  const SQFT_PER_SQM = 10.7639;
  const [draft, setDraft] = useState(cityRentEstimates);

  useEffect(() => {
    setDraft(cityRentEstimates);
  }, [cityRentEstimates]);

  const updateRange = (city, field, value) => {
    setDraft((prev) => ({
      ...prev,
      [city]: {
        ...(prev[city] || FALLBACK_CITY_RENT_RANGE),
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    const nextRanges = cityList.reduce((acc, city) => {
      acc[city] = normalizeCityRange(
        draft[city],
        cityRentEstimates[city] || FALLBACK_CITY_RENT_RANGE
      );
      return acc;
    }, {});

    onSave(nextRanges);
  };

  const getPropertySquareFeet = (property) => {
    const squareMeters = getPropertySurfaceSqm(property, properties || []);

    return squareMeters * SQFT_PER_SQM;
  };

  const toMonthlyRate = (annualSqftRate, squareFeet) => {
    const parsedRate = Number(annualSqftRate);
    if (!parsedRate || !squareFeet) return null;
    return (parsedRate * squareFeet) / 12;
  };

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-sm font-semibold">City rent estimates</h3>
      {cityList.length ? (
        <>
          <p className="text-sm text-muted-foreground">
            Set annual ranges in $ / sq ft / year using cities found in your
            properties.
          </p>
          <p className="text-xs text-muted-foreground">
            Property calculations below are a preview in this tab and update as
            you edit. They are applied only when you click Save estimates.
          </p>
          <div className="space-y-2">
            {cityList.map((city) => (
              <div key={city} className="rounded border p-3 space-y-3">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                  <div className="text-sm font-medium self-center">{city}</div>
                  <input
                    type="number"
                    value={draft[city]?.low ?? ''}
                    onChange={(e) => updateRange(city, 'low', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="Low"
                  />
                  <input
                    type="number"
                    value={draft[city]?.medium ?? ''}
                    onChange={(e) =>
                      updateRange(city, 'medium', e.target.value)
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="Medium"
                  />
                  <input
                    type="number"
                    value={draft[city]?.high ?? ''}
                    onChange={(e) => updateRange(city, 'high', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="High"
                  />
                </div>

                <div className="space-y-2">
                  {(properties || [])
                    .filter(
                      (property) =>
                        property?.address?.city?.trim()?.toLowerCase() ===
                        city.toLowerCase()
                    )
                    .map((property) => {
                      const squareFeet = getPropertySquareFeet(property);
                      const lowMonthly = toMonthlyRate(
                        draft[city]?.low,
                        squareFeet
                      );
                      const mediumMonthly = toMonthlyRate(
                        draft[city]?.medium,
                        squareFeet
                      );
                      const highMonthly = toMonthlyRate(
                        draft[city]?.high,
                        squareFeet
                      );

                      return (
                        <div
                          key={property._id}
                          className="rounded border border-dashed p-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-medium">
                              {property.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {Number(squareFeet.toFixed(2))} sq ft
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                            <div className="text-xs">
                              <span className="text-muted-foreground">
                                Low:{' '}
                              </span>
                              {lowMonthly ? (
                                <NumberFormat value={lowMonthly} />
                              ) : (
                                '-'
                              )}{' '}
                              / month
                            </div>
                            <div className="text-xs">
                              <span className="text-muted-foreground">
                                Medium:{' '}
                              </span>
                              {mediumMonthly ? (
                                <NumberFormat value={mediumMonthly} />
                              ) : (
                                '-'
                              )}{' '}
                              / month
                            </div>
                            <div className="text-xs">
                              <span className="text-muted-foreground">
                                High:{' '}
                              </span>
                              {highMonthly ? (
                                <NumberFormat value={highMonthly} />
                              ) : (
                                '-'
                              )}{' '}
                              / month
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Save estimates
          </button>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">
          No property cities found yet. Add property addresses first.
        </div>
      )}
    </Card>
  );
}

function PropertyOverviewCard() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const SQFT_PER_SQM = 10.7639;

  // Calculate total square footage from children if this is a parent property
  const totalSquareFootage =
    store.property.selected?.childProperties?.reduce((sum, child) => {
      return sum + (child.surface || 0);
    }, 0) || 0;

  // Check if this property has children (is a parent)
  const isParentProperty =
    (store.property.selected?.childProperties?.length || 0) > 0;
  const displayedSquareMeters = isParentProperty
    ? totalSquareFootage
    : store.property.selected?.surface || 0;
  const displayedSquareFeet = displayedSquareMeters * SQFT_PER_SQM;

  // Get parent property if this is a unit
  const parentPropertyId = getParentPropertyIdValue(
    store.property.selected?.parentPropertyId
  );
  const parentProperty = parentPropertyId
    ? store.property.items.find((p) => p._id === parentPropertyId)
    : null;

  // Get child units if this is a building
  const childUnits = (store.property.items || []).filter(
    (item) =>
      String(getParentPropertyIdValue(item?.parentPropertyId) || '') ===
      String(store.property.selected?._id || '')
  );

  const navigateToProperty = (propertyId) => {
    router.push(
      `/${store.organization.selected.name}/properties/${propertyId}`
    );
  };

  return (
    <DashboardCard
      Icon={LuKeyRound}
      title={t('Property')}
      renderContent={() => (
        <div className="text-base space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {store.property.selected.name}
            </span>
            <NumberFormat value={store.property.selected.price} />
          </div>
          {displayedSquareFeet > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t('Total Surface Area')}:
              </span>
              <span>{displayedSquareFeet.toFixed(2)} sq ft</span>
            </div>
          )}
          {parentProperty && (
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-1">
                {t('Part of Building')}:
              </div>
              <button
                onClick={() => navigateToProperty(parentProperty._id)}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {parentProperty.name}
              </button>
            </div>
          )}
          {childUnits.length > 0 && (
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-1">
                {t('Units')} ({childUnits.length}):
              </div>
              <div className="space-y-1">
                {childUnits.map((unit) => (
                  <button
                    key={unit._id}
                    onClick={() => navigateToProperty(unit._id)}
                    className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {unit.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Map address={store.property.selected.address} />
        </div>
      )}
    />
  );
}

function OccupancyHistoryCard() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  return (
    <DashboardCard
      Icon={LuHistory}
      title={t('Previous tenants')}
      renderContent={() =>
        store.property.selected?.occupancyHistory?.length ? (
          store.property.selected.occupancyHistory.map((occupant) => {
            const occupationDates = t('{{beginDate}} to {{endDate}}', {
              beginDate: moment(occupant.beginDate, 'DD/MM/YYYY').format('ll'),
              endDate: moment(occupant.endDate, 'DD/MM/YYYY').format('ll')
            });
            return (
              <div key={occupant.id} className="mt-2">
                <div className="text-base">{occupant.name}</div>
                <div className="text-xs text-muted-foreground">
                  {occupationDates}
                </div>
              </div>
            );
          })
        ) : (
          <span className="text-base text-muted-foreground">
            {t('Property not rented so far')}
          </span>
        )
      }
    />
  );
}

function RentCard({ onSubmit, cityRentEstimates }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const SQFT_PER_SQM = 10.7639;
  const cityPresetOptions = Object.keys(cityRentEstimates);
  const propertyCity = store.property.selected?.address?.city;
  const selectedCityKey = getPresetCity(propertyCity, cityRentEstimates);
  const cityEstimateForProperty = selectedCityKey
    ? cityRentEstimates[selectedCityKey]
    : null;
  const [editMode, setEditMode] = useState(false);
  const [rentValue, setRentValue] = useState(
    store.property.selected?.price || ''
  );
  const [rentLow, setRentLow] = useState(
    pickRentValue(
      store.property.selected?.rentLowSqftYear,
      cityEstimateForProperty?.low
    )
  );
  const [rentMedian, setRentMedian] = useState(
    pickRentValue(
      store.property.selected?.rentMedianSqftYear,
      cityEstimateForProperty?.medium
    )
  );
  const [rentHigh, setRentHigh] = useState(
    pickRentValue(
      store.property.selected?.rentHighSqftYear,
      cityEstimateForProperty?.high
    )
  );
  const [cityForEstimate, setCityForEstimate] = useState(
    getPresetCity(store.property.selected?.address?.city, cityRentEstimates) ||
      cityPresetOptions[0] ||
      ''
  );

  useEffect(() => {
    setRentValue(store.property.selected?.price || '');
    setRentLow(
      pickRentValue(
        store.property.selected?.rentLowSqftYear,
        cityEstimateForProperty?.low
      )
    );
    setRentMedian(
      pickRentValue(
        store.property.selected?.rentMedianSqftYear,
        cityEstimateForProperty?.medium
      )
    );
    setRentHigh(
      pickRentValue(
        store.property.selected?.rentHighSqftYear,
        cityEstimateForProperty?.high
      )
    );
    setCityForEstimate(
      getPresetCity(
        store.property.selected?.address?.city,
        cityRentEstimates
      ) ||
        cityPresetOptions[0] ||
        ''
    );
  }, [
    cityEstimateForProperty?.high,
    cityEstimateForProperty?.low,
    cityEstimateForProperty?.medium,
    cityRentEstimates,
    cityPresetOptions,
    store.property.selected
  ]);

  const isParentProperty = (store.property.items || []).some(
    (item) =>
      String(getParentPropertyIdValue(item?.parentPropertyId) || '') ===
      String(store.property.selected?._id || '')
  );
  const displayedSquareFootage = getPropertySurfaceSqm(
    store.property.selected,
    store.property.items || []
  );
  // Note: Despite the function name, surface is stored in sq ft
  const displayedSquareFeet = displayedSquareFootage;
  const formattedSquareFeet = Number(displayedSquareFeet.toFixed(2));

  const handleSaveRent = async () => {
    await onSubmit({
      rent: parseFloat(rentValue) || 0,
      rentLowSqftYear: rentLow ? parseFloat(rentLow) : null,
      rentMedianSqftYear: rentMedian ? parseFloat(rentMedian) : null,
      rentHighSqftYear: rentHigh ? parseFloat(rentHigh) : null
    });
    setEditMode(false);
  };

  const toMonthlyRate = (annualSqftRate) => {
    const parsedRate = Number(annualSqftRate);
    if (!parsedRate || !displayedSquareFootage) return null;
    return (parsedRate * displayedSquareFootage) / 12;
  };

  const applyCityEstimate = () => {
    const cityRange = cityRentEstimates[cityForEstimate];
    if (!cityRange) return;

    setRentLow(String(cityRange.low));
    setRentMedian(String(cityRange.medium));
    setRentHigh(String(cityRange.high));

    const estimatedMedianMonthly = toMonthlyRate(cityRange.medium);
    if (estimatedMedianMonthly) {
      setRentValue(estimatedMedianMonthly.toFixed(2));
    }
  };

  const rentRangeValues = [
    {
      label: t('Low'),
      value: pickRentValue(
        store.property.selected?.rentLowSqftYear,
        cityEstimateForProperty?.low
      ),
      monthly: toMonthlyRate(
        pickRentValue(
          store.property.selected?.rentLowSqftYear,
          cityEstimateForProperty?.low
        )
      )
    },
    {
      label: t('Medium'),
      value: pickRentValue(
        store.property.selected?.rentMedianSqftYear,
        cityEstimateForProperty?.medium
      ),
      monthly: toMonthlyRate(
        pickRentValue(
          store.property.selected?.rentMedianSqftYear,
          cityEstimateForProperty?.medium
        )
      )
    },
    {
      label: t('High'),
      value: pickRentValue(
        store.property.selected?.rentHighSqftYear,
        cityEstimateForProperty?.high
      ),
      monthly: toMonthlyRate(
        pickRentValue(
          store.property.selected?.rentHighSqftYear,
          cityEstimateForProperty?.high
        )
      )
    }
  ];

  const rentRangeDraftValues = [
    { label: t('Low'), value: rentLow, monthly: toMonthlyRate(rentLow) },
    {
      label: t('Medium'),
      value: rentMedian,
      monthly: toMonthlyRate(rentMedian)
    },
    { label: t('High'), value: rentHigh, monthly: toMonthlyRate(rentHigh) }
  ];

  return (
    <Card className="p-6 space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold">{t('Rent Information')}</h3>
          <button
            onClick={() => setEditMode(!editMode)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {editMode ? t('Cancel') : t('Edit')}
          </button>
        </div>
        {editMode ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                City range estimate ($ / sq ft / year)
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={cityForEstimate}
                  onChange={(e) => setCityForEstimate(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-sm"
                  disabled={!cityPresetOptions.length}
                >
                  {cityPresetOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={applyCityEstimate}
                  className="px-3 py-1.5 border rounded text-sm whitespace-nowrap"
                  disabled={!cityPresetOptions.length}
                >
                  Apply city range
                </button>
              </div>
              {!cityPresetOptions.length && (
                <div className="text-xs text-muted-foreground">
                  No city estimates configured yet. Use the Estimates tab.
                </div>
              )}
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                {t('Rent excluding tax and expenses')}
              </label>
              <input
                type="number"
                value={rentValue}
                onChange={(e) => setRentValue(e.target.value)}
                className="w-full px-2 py-1 border rounded"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                {t('Rent Range ($ / sq ft / year)')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    {t('Low')}
                  </label>
                  <input
                    type="number"
                    value={rentLow}
                    onChange={(e) => setRentLow(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    {t('Medium')}
                  </label>
                  <input
                    type="number"
                    value={rentMedian}
                    onChange={(e) => setRentMedian(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    {t('High')}
                  </label>
                  <input
                    type="number"
                    value={rentHigh}
                    onChange={(e) => setRentHigh(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
              </div>
            </div>
            {displayedSquareFootage > 0 && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Estimated monthly rent
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {rentRangeDraftValues.map(({ label, monthly }) => (
                    <div key={label} className="rounded border p-2">
                      <div className="text-xs text-muted-foreground">
                        {label}
                      </div>
                      {monthly ? (
                        <div className="text-sm font-semibold">
                          <NumberFormat value={monthly} /> / month
                        </div>
                      ) : (
                        <div className="text-sm font-semibold">-</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleSaveRent}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              {t('Save')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">
                {t('Rent excluding tax and expenses')}
              </span>
              <NumberFormat
                value={store.property.selected?.price}
                className="text-lg font-semibold"
              />
            </div>
            {displayedSquareFootage > 0 && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">
                  {isParentProperty ? t('Total Surface Area') : t('Surface')}
                </span>
                <span className="text-lg font-semibold">
                  {formattedSquareFeet} sq ft
                </span>
              </div>
            )}
            {displayedSquareFootage > 0 &&
              store.property.selected?.price > 0 && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    Rent per sq ft
                  </span>
                  <span className="text-lg font-semibold">
                    <NumberFormat
                      value={
                        store.property.selected.price / formattedSquareFeet
                      }
                    />{' '}
                    / sq ft
                  </span>
                </div>
              )}
            <div className="space-y-2 py-2 border-b">
              <span className="text-sm text-muted-foreground">
                {t('Rent Range ($ / sq ft / year)')}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {rentRangeValues.map(({ label, value, monthly }) => (
                  <div key={label} className="rounded border p-2">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="text-sm font-semibold">
                      {value !== null && value !== undefined && value !== ''
                        ? `${value} / sq ft / year`
                        : '-'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {monthly ? (
                        <>
                          <NumberFormat value={monthly} /> / month
                        </>
                      ) : (
                        '-'
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {isParentProperty && (
        <div>
          <h3 className="text-sm font-semibold mb-4">{t('Sub-properties')}</h3>
          <div className="space-y-2">
            {store.property.selected.childProperties?.map((child) => (
              <div
                key={child._id}
                className="flex justify-between items-center py-2 border-b"
              >
                <div>
                  <div className="text-sm">{child.name}</div>
                  {child.surface > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {Number((child.surface * SQFT_PER_SQM).toFixed(2))} sq ft
                    </div>
                  )}
                </div>
                <NumberFormat value={child.price} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function FilesPanel() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = useCallback(async () => {
    if (!store.property.selected?._id) return;
    setLoading(true);
    try {
      const response = await apiFetcher().get(
        `/properties/${store.property.selected._id}/attachments`
      );
      setFiles(response.data || []);
    } catch (error) {
      toast.error(t('Failed to load files'));
    } finally {
      setLoading(false);
    }
  }, [store.property.selected?._id, t]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileUpload = async (event) => {
    const fileInput = event.target;
    const file = fileInput.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetType', 'property');
      formData.append('targetId', store.property.selected._id);
      formData.append('category', 'property_photo');

      await apiFetcher().post('/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(t('File uploaded successfully'));
      fetchFiles();
    } catch (error) {
      toast.error(t('Failed to upload file'));
    } finally {
      setUploading(false);
      fileInput.value = '';
    }
  };

  const handleDownload = async (attachmentId, filename) => {
    try {
      const response = await apiFetcher().get(
        `/attachments/${attachmentId}/download`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error(t('Failed to download file'));
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">{t('Files & Documents')}</h3>
        <label className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm cursor-pointer">
          {uploading ? t('Uploading...') : t('Upload File')}
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">{t('Loading...')}</div>
      ) : files.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          {t('No files uploaded yet')}
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file._id}
              className="flex justify-between items-center py-2 px-3 border rounded hover:bg-gray-50"
            >
              <div>
                <div className="text-sm font-medium">{file.filename}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(file.createdAt).toLocaleDateString()} •{' '}
                  {(file.size / 1024).toFixed(1)} KB
                  {file.backupStatus === 'success' && ' • Backed up ✓'}
                  {file.backupStatus === 'pending' && ' • Backup pending...'}
                  {file.backupStatus === 'failed' && ' • Backup failed ⚠'}
                </div>
              </div>
              <button
                onClick={() => handleDownload(file._id, file.filename)}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                {t('Download')}
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ProjectsPanel() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const [projects, setProjects] = useState([]);
  const [projectsByPropertyId, setProjectsByPropertyId] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    status: 'planned',
    startDate: '',
    endDate: ''
  });

  const fetchProjects = useCallback(async () => {
    if (!store.property.selected?._id) return;

    setLoading(true);

    try {
      let allProperties = store.property.items || [];
      if (!allProperties.length) {
        const propertiesResult = await store.property.fetch();
        allProperties = propertiesResult?.data || [];
      }

      const currentProperty = store.property.selected;
      const currentPropertyId = String(currentProperty._id);

      const subProperties = allProperties.filter((property) => {
        const parentId = getParentPropertyIdValue(property?.parentPropertyId);
        return String(parentId || '') === currentPropertyId;
      });

      const propertyTargets = [currentProperty, ...subProperties].filter(
        (property, index, array) => {
          const propertyId = String(property?._id || '');
          return (
            propertyId &&
            array.findIndex(
              (item) => String(item?._id || '') === propertyId
            ) === index
          );
        }
      );

      const projectResponses = await Promise.all(
        propertyTargets.map(async (property, index) => {
          const response = await apiFetcher().get('/projects', {
            baseURL: '/api/v2',
            params: {
              targetType: 'property',
              targetId: property._id,
              _: Date.now() + index
            }
          });

          return {
            propertyId: property._id,
            propertyName: property.name,
            projects: response.data || []
          };
        })
      );

      const groupedProjects = projectResponses.reduce((acc, group) => {
        acc[group.propertyId] = {
          propertyName: group.propertyName,
          projects: group.projects
        };
        return acc;
      }, {});

      setProjectsByPropertyId(groupedProjects);
      setProjects(projectResponses.flatMap((group) => group.projects));
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') {
        return;
      }

      const errorMessage = error?.response?.data?.message;
      const status = error?.response?.status;
      toast.error(
        errorMessage || status
          ? `${t('Failed to load projects')}: ${errorMessage || status}`
          : `${t('Failed to load projects')}: ${error?.message || 'unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  }, [store.property.selected?._id, t]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async () => {
    if (!newProject.title) {
      toast.error(t('Project title is required'));
      return;
    }

    const payload = {
      ...newProject,
      targetType: 'property',
      targetId: store.property.selected._id
    };

    if (!payload.startDate) {
      delete payload.startDate;
    }

    if (!payload.endDate) {
      delete payload.endDate;
    }

    try {
      await apiFetcher().post('/projects', payload, {
        baseURL: '/api/v2'
      });
      toast.success(t('Project created successfully'));
      setShowCreateForm(false);
      setNewProject({
        title: '',
        description: '',
        status: 'planned',
        startDate: '',
        endDate: ''
      });
      fetchProjects();
    } catch (error) {
      const errorMessage = error?.response?.data?.message;
      const status = error?.response?.status;
      toast.error(
        errorMessage || status
          ? `${t('Failed to create project')}: ${errorMessage || status}`
          : `${t('Failed to create project')}: ${error?.message || 'unknown error'}`
      );
    }
  };

  const statusColors = {
    planned: 'bg-gray-200 text-gray-800',
    'in-progress': 'bg-blue-200 text-blue-800',
    completed: 'bg-green-200 text-green-800',
    'on-hold': 'bg-yellow-200 text-yellow-800',
    cancelled: 'bg-red-200 text-red-800'
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">{t('Projects')}</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          {showCreateForm ? t('Cancel') : t('New Project')}
        </button>
      </div>

      {showCreateForm && (
        <div className="border rounded p-4 space-y-3">
          <input
            type="text"
            value={newProject.title}
            onChange={(e) =>
              setNewProject({ ...newProject, title: e.target.value })
            }
            placeholder={t('Project title')}
            className="w-full px-3 py-2 border rounded"
          />
          <textarea
            value={newProject.description}
            onChange={(e) =>
              setNewProject({ ...newProject, description: e.target.value })
            }
            placeholder={t('Description')}
            className="w-full px-3 py-2 border rounded"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('Start Date')}
              </label>
              <input
                type="date"
                value={newProject.startDate}
                onChange={(e) =>
                  setNewProject({ ...newProject, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('End Date')}
              </label>
              <input
                type="date"
                value={newProject.endDate}
                onChange={(e) =>
                  setNewProject({ ...newProject, endDate: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
          <select
            value={newProject.status}
            onChange={(e) =>
              setNewProject({ ...newProject, status: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
          >
            <option value="planned">{t('Planned')}</option>
            <option value="in-progress">{t('In Progress')}</option>
            <option value="completed">{t('Completed')}</option>
            <option value="on-hold">{t('On Hold')}</option>
            <option value="cancelled">{t('Cancelled')}</option>
          </select>
          <button
            onClick={handleCreateProject}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            {t('Create Project')}
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">{t('Loading...')}</div>
      ) : projects.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          {t('No projects yet')}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(projectsByPropertyId).map(([propertyId, group]) => (
            <div key={propertyId} className="space-y-2">
              <h4 className="text-sm font-semibold">
                {String(propertyId) === String(store.property.selected?._id)
                  ? `${t('Property')}: ${group.propertyName || t('Current Property')}`
                  : `${t('Sub Property')}: ${group.propertyName || '-'}`}
              </h4>

              {group.projects.length === 0 ? (
                <div className="text-xs text-muted-foreground rounded border border-dashed p-3">
                  {t('No projects yet')}
                </div>
              ) : (
                group.projects.map((project) => (
                  <div
                    key={project._id}
                    className="border rounded p-4 space-y-2 cursor-pointer hover:bg-muted/30"
                    onClick={() =>
                      router.push(
                        `/${router.query.organization}/projects/${project._id}`
                      )
                    }
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{project.title}</h4>
                      <span
                        className={`px-2 py-1 rounded text-xs ${statusColors[project.status] || statusColors.planned}`}
                      >
                        {t(project.status)}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground">
                        {project.description}
                      </p>
                    )}
                    {(project.startDate || project.endDate) && (
                      <div className="text-xs text-muted-foreground">
                        {project.startDate && (
                          <span>
                            Start:{' '}
                            {new Date(project.startDate).toLocaleDateString()}
                          </span>
                        )}
                        {project.endDate && (
                          <span className="ml-3">
                            End:{' '}
                            {new Date(project.endDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                    {(project.estimatedCost || project.actualCost) && (
                      <div className="text-xs text-muted-foreground">
                        {project.estimatedCost && (
                          <span>Estimated: ${project.estimatedCost}</span>
                        )}
                        {project.actualCost && (
                          <span className="ml-3">
                            Actual: ${project.actualCost}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

async function fetchData(store, router) {
  const results = await store.property.fetchOne(router.query.id);
  store.property.setSelected(
    store.property.items.find(({ _id }) => _id === router.query.id)
  );
  return results;
}

function Property() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const organizationName = store.organization.selected?.name;
  const [openConfirmDeletePropertyDialog, setOpenConfirmDeletePropertyDialog] =
    useState(false);
  const [cityRentEstimates, setCityRentEstimates] = useState(() =>
    mergeCityRentRanges()
  );
  const [cityList, setCityList] = useState([]);
  const [fetching] = useFillStore(fetchData, [router]);

  useEffect(() => {
    const storedRanges = loadCityRentRanges(organizationName);
    setCityRentEstimates((previousRanges) =>
      mergeCityRentRanges(storedRanges, Object.keys(previousRanges))
    );
  }, [organizationName]);

  useEffect(() => {
    let isMounted = true;

    const fetchPropertyCities = async () => {
      const response = await store.property.fetch();
      if (!isMounted || response.status !== 200) {
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

  const handleBack = useCallback(() => {
    router.push(store.appHistory.previousPath);
  }, [router, store.appHistory.previousPath]);

  const onConfirmDeleteProperty = useCallback(() => {
    setOpenConfirmDeletePropertyDialog(true);
  }, [setOpenConfirmDeletePropertyDialog]);

  const onDeleteProperty = useCallback(async () => {
    const { status } = await store.property.delete([
      store.property.selected._id
    ]);
    if (status !== 200) {
      switch (status) {
        case 422:
          return toast.error(t('Property cannot be deleted'));
        case 404:
          return toast.error(t('Property does not exist'));
        case 403:
          return toast.error(t('You are not allowed to delete the Property'));
        default:
          return toast.error(t('Something went wrong'));
      }
    }

    await router.push(store.appHistory.previousPath);
  }, [store, router, t]);

  const onSubmit = useCallback(
    async (propertyPart) => {
      let property = {
        ...toJS(store.property.selected),
        ...propertyPart,
        price: propertyPart.rent
      };

      if (property._id) {
        const { status, data } = await store.property.update(property);
        if (status !== 200) {
          switch (status) {
            case 422:
              return toast.error(t('Property name is missing'));
            case 403:
              return toast.error(
                t('You are not allowed to update the property')
              );
            default:
              return toast.error(t('Something went wrong'));
          }
        }
        store.property.setSelected(data);
      } else {
        const { status, data } = await store.property.create(property);
        if (status !== 200) {
          switch (status) {
            case 422:
              return toast.error(t('Property name is missing'));
            case 403:
              return toast.error(t('You are not allowed to add a property'));
            case 409:
              return toast.error(t('The property already exists'));
            default:
              return toast.error(t('Something went wrong'));
          }
        }
        store.property.setSelected(data);
        await router.push(
          `/${store.organization.selected.name}/properties/${data._id}`
        );
      }
    },
    [store, t, router]
  );

  return (
    <Page
      loading={fetching}
      ActionBar={
        <div className="grid grid-cols-5 gap-1.5 md:gap-4">
          <ShortcutButton
            label={t('Back')}
            Icon={LuArrowLeft}
            onClick={handleBack}
          />
          <ShortcutButton
            label={t('Delete')}
            Icon={LuTrash}
            onClick={onConfirmDeleteProperty}
            className="col-start-2 col-end-2"
            dataCy="removeResourceButton"
          />
        </div>
      }
      dataCy="propertyPage"
    >
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Tabs defaultValue="property" className="md:col-span-2">
            <TabsList className="flex justify-start overflow-x-auto overflow-y-hidden">
              <TabsTrigger value="property" className="w-1/5">
                {t('Property')}
              </TabsTrigger>
              <TabsTrigger value="rent" className="w-1/5">
                {t('Rent')}
              </TabsTrigger>
              <TabsTrigger value="files" className="w-1/5">
                {t('Files')}
              </TabsTrigger>
              <TabsTrigger value="projects" className="w-1/5">
                {t('Projects')}
              </TabsTrigger>
              <TabsTrigger value="notes" className="w-1/5">
                {t('Notes')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="property">
              <div className="space-y-4">
                <Card className="p-6">
                  <PropertyForm onSubmit={onSubmit} />
                </Card>
                <CityEstimatesCard
                  cityList={cityList}
                  cityRentEstimates={cityRentEstimates}
                  properties={store.property.items}
                  onSave={onSaveCityRentEstimates}
                />
              </div>
            </TabsContent>
            <TabsContent value="rent">
              <RentCard
                onSubmit={onSubmit}
                cityRentEstimates={cityRentEstimates}
              />
            </TabsContent>
            <TabsContent value="files">
              <FilesPanel />
            </TabsContent>
            <TabsContent value="projects">
              <ProjectsPanel />
            </TabsContent>
            <TabsContent value="notes">
              <NotesPanel
                entityType="property"
                entityId={store.property.selected?._id}
              />
            </TabsContent>
          </Tabs>
          <div className="hidden md:grid grid-cols-1 gap-4 h-fit">
            <PropertyOverviewCard />
            <OccupancyHistoryCard />
          </div>
        </div>

        <ConfirmDialog
          title={t('Are you sure to definitely remove this property?')}
          subTitle={store.property.selected.name}
          open={openConfirmDeletePropertyDialog}
          setOpen={setOpenConfirmDeletePropertyDialog}
          onConfirm={onDeleteProperty}
        />
      </>
    </Page>
  );
}

export default withAuthentication(observer(Property));
