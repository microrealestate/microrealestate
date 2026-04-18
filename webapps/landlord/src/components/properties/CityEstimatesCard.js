import { Card } from '../ui/card';
import { useEffect, useState } from 'react';

export const DEFAULT_CITY_RENT_RANGE_BY_SQFT_YEAR = {
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

export const FALLBACK_CITY_RENT_RANGE = { low: 25, medium: 35, high: 45 };
export const CITY_RENT_RANGE_STORAGE_KEY_PREFIX = 'mre.cityRentRangeBySqftYear';

function toValidNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeCityRange(
  range = {},
  fallback = FALLBACK_CITY_RENT_RANGE
) {
  return {
    low: toValidNumber(range.low, fallback.low),
    medium: toValidNumber(range.medium, fallback.medium),
    high: toValidNumber(range.high, fallback.high)
  };
}

export function mergeCityRentRanges(customRanges = {}, cityList = []) {
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

export function getStorageKey(organizationName) {
  return `${CITY_RENT_RANGE_STORAGE_KEY_PREFIX}.${organizationName || 'default'}`;
}

export function loadCityRentRanges(organizationName) {
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

export function saveCityRentRanges(organizationName, ranges) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    getStorageKey(organizationName),
    JSON.stringify(ranges)
  );
}

export function getPresetCity(city = '', cityRentRanges = {}) {
  const normalizedInput = city.trim().toLowerCase();
  return (
    Object.keys(cityRentRanges).find(
      (presetCity) => presetCity.toLowerCase() === normalizedInput
    ) || ''
  );
}

function getRentPositionLabel(
  currentMonthly,
  lowMonthly,
  mediumMonthly,
  highMonthly
) {
  if (!Number.isFinite(currentMonthly)) {
    return 'Current rent unavailable';
  }

  if (currentMonthly < lowMonthly) {
    return 'Below low estimate';
  }

  if (currentMonthly < mediumMonthly) {
    return 'Between low and medium';
  }

  if (currentMonthly < highMonthly) {
    return 'Between medium and high';
  }

  return 'Above high estimate';
}

function getRentStatusBadge(currentMonthly, lowMonthly, highMonthly) {
  if (!Number.isFinite(currentMonthly)) {
    return {
      label: 'Unavailable',
      className: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  }

  if (currentMonthly < lowMonthly) {
    return {
      label: 'Underpriced',
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };
  }

  if (currentMonthly > highMonthly) {
    return {
      label: 'Over-market',
      className: 'bg-red-100 text-red-700 border-red-200'
    };
  }

  return {
    label: 'At-market',
    className: 'bg-amber-100 text-amber-700 border-amber-200'
  };
}

export default function CityEstimatesCard({
  cityList,
  cityRentEstimates,
  onSave
}) {
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

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-sm font-semibold">City rent estimates</h3>
      {cityList.length ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Set annual ranges in $ / sq ft / year using cities found in your
            properties.
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
                    className="w-full px-2 py-1 border rounded text-sm bg-background text-foreground"
                    placeholder="Low"
                  />
                  <input
                    type="number"
                    value={draft[city]?.medium ?? ''}
                    onChange={(e) => updateRange(city, 'medium', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm bg-background text-foreground"
                    placeholder="Medium"
                  />
                  <input
                    type="number"
                    value={draft[city]?.high ?? ''}
                    onChange={(e) => updateRange(city, 'high', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm bg-background text-foreground"
                    placeholder="High"
                  />
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
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          No property cities found yet. Add property addresses first.
        </div>
      )}
    </Card>
  );
}
