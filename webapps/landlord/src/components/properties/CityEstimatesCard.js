/* eslint-disable sort-imports */
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from 'recharts';
import { Card } from '../ui/card';
import { ChartContainer } from '../ui/chart';
import {
  getPropertySurfaceSqm,
  sqmToSqft
} from '../../utils/surfaceConversion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useEffect, useMemo, useState } from 'react';
import { default as NumberFormat } from '../NumberFormat';
/* eslint-enable sort-imports */

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
  properties,
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

  const toMonthlyRate = (annualSqftRate, squareFeet) => {
    const parsedRate = Number(annualSqftRate);
    if (!parsedRate || !squareFeet) return null;
    return (parsedRate * squareFeet) / 12;
  };

  const propertiesByCity = useMemo(() => {
    return (properties || []).reduce((acc, property) => {
      const city = property?.address?.city?.trim();
      if (!city) {
        return acc;
      }

      const normalizedCity = city.toLowerCase();
      if (!acc[normalizedCity]) {
        acc[normalizedCity] = [];
      }

      acc[normalizedCity].push(property);
      return acc;
    }, {});
  }, [properties]);

  const reportByCity = useMemo(() => {
    return cityList
      .map((city) => {
        const cityProperties = propertiesByCity[city.toLowerCase()] || [];
        const cityRange = normalizeCityRange(
          draft[city],
          cityRentEstimates[city] || FALLBACK_CITY_RENT_RANGE
        );

        const propertiesReport = cityProperties.map((property) => {
          const squareFeet = sqmToSqft(
            getPropertySurfaceSqm(property, properties || [])
          );
          const lowMonthly = toMonthlyRate(cityRange.low, squareFeet) || 0;
          const mediumMonthly =
            toMonthlyRate(cityRange.medium, squareFeet) || 0;
          const highMonthly = toMonthlyRate(cityRange.high, squareFeet) || 0;
          const currentMonthly = Number(property?.price);

          return {
            property,
            squareFeet,
            lowMonthly,
            mediumMonthly,
            highMonthly,
            currentMonthly,
            statusBadge: getRentStatusBadge(
              currentMonthly,
              lowMonthly,
              highMonthly
            ),
            positionLabel: getRentPositionLabel(
              currentMonthly,
              lowMonthly,
              mediumMonthly,
              highMonthly
            ),
            chartData: [
              { label: 'Low', value: lowMonthly, fill: 'hsl(var(--chart-3))' },
              {
                label: 'Medium',
                value: mediumMonthly,
                fill: 'hsl(var(--chart-2))'
              },
              {
                label: 'High',
                value: highMonthly,
                fill: 'hsl(var(--chart-1))'
              },
              {
                label: 'Current',
                value: Number.isFinite(currentMonthly) ? currentMonthly : 0,
                fill: 'hsl(var(--primary))'
              }
            ]
          };
        });

        return {
          city,
          cityRange,
          propertiesReport
        };
      })
      .filter(({ propertiesReport }) => propertiesReport.length > 0);
  }, [cityList, cityRentEstimates, draft, properties, propertiesByCity]);

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-sm font-semibold">City rent estimates</h3>
      {cityList.length ? (
        <>
          <Tabs defaultValue="edit-estimates" className="space-y-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit-estimates">Edit estimates</TabsTrigger>
              <TabsTrigger value="rent-report">Rent report</TabsTrigger>
            </TabsList>

            <TabsContent value="edit-estimates" className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Set annual ranges in $ / sq ft / year using cities found in your
                properties.
              </p>
              <div className="space-y-2">
                {cityList.map((city) => (
                  <div key={city} className="rounded border p-3 space-y-3">
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                      <div className="text-sm font-medium self-center">
                        {city}
                      </div>
                      <input
                        type="number"
                        value={draft[city]?.low ?? ''}
                        onChange={(e) =>
                          updateRange(city, 'low', e.target.value)
                        }
                        className="w-full px-2 py-1 border rounded text-sm bg-background text-foreground"
                        placeholder="Low"
                      />
                      <input
                        type="number"
                        value={draft[city]?.medium ?? ''}
                        onChange={(e) =>
                          updateRange(city, 'medium', e.target.value)
                        }
                        className="w-full px-2 py-1 border rounded text-sm bg-background text-foreground"
                        placeholder="Medium"
                      />
                      <input
                        type="number"
                        value={draft[city]?.high ?? ''}
                        onChange={(e) =>
                          updateRange(city, 'high', e.target.value)
                        }
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
            </TabsContent>

            <TabsContent value="rent-report" className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Compare each property&apos;s current monthly rent against the
                low, medium, and high monthly estimate for its city.
              </p>

              {reportByCity.length ? (
                <div className="space-y-3">
                  {reportByCity.map(({ city, cityRange, propertiesReport }) => (
                    <div key={city} className="rounded border p-3 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold">{city}</div>
                        <div className="text-xs text-muted-foreground">
                          {`Rates ($/sq ft/year): low ${cityRange.low} | medium ${cityRange.medium} | high ${cityRange.high}`}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {propertiesReport.map(
                          ({
                            property,
                            squareFeet,
                            lowMonthly,
                            mediumMonthly,
                            highMonthly,
                            currentMonthly,
                            statusBadge,
                            positionLabel,
                            chartData
                          }) => (
                            <div
                              key={property._id}
                              className="rounded border border-dashed p-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="text-sm font-medium">
                                  {property.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {Number(squareFeet.toFixed(2))} sq ft
                                </div>
                              </div>

                              <div className="mt-2 text-xs">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadge.className}`}
                                  >
                                    {statusBadge.label}
                                  </span>
                                  <span className="text-muted-foreground">
                                    Position:
                                  </span>
                                  <span className="font-medium">
                                    {positionLabel}
                                  </span>
                                </div>
                              </div>

                              <ChartContainer
                                config={{
                                  low: { color: 'hsl(var(--chart-3))' },
                                  medium: { color: 'hsl(var(--chart-2))' },
                                  high: { color: 'hsl(var(--chart-1))' },
                                  current: { color: 'hsl(var(--primary))' }
                                }}
                                className="mt-3 h-[220px] w-full"
                              >
                                <BarChart
                                  data={chartData}
                                  margin={{
                                    top: 8,
                                    right: 8,
                                    left: 8,
                                    bottom: 8
                                  }}
                                >
                                  <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                  />
                                  <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    width={70}
                                  />
                                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry) => (
                                      <Cell
                                        key={`${property._id}-${entry.label}`}
                                        fill={entry.fill}
                                      />
                                    ))}
                                    <LabelList
                                      dataKey="value"
                                      position="top"
                                      formatter={(value) =>
                                        Number.isFinite(value)
                                          ? `$${Math.round(value).toLocaleString()}`
                                          : '-'
                                      }
                                    />
                                  </Bar>
                                </BarChart>
                              </ChartContainer>

                              <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                                <div>
                                  <span className="text-muted-foreground">
                                    Low:
                                  </span>{' '}
                                  <NumberFormat value={lowMonthly} /> / month
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Medium:
                                  </span>{' '}
                                  <NumberFormat value={mediumMonthly} /> / month
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    High:
                                  </span>{' '}
                                  <NumberFormat value={highMonthly} /> / month
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Current:
                                  </span>{' '}
                                  {Number.isFinite(currentMonthly) ? (
                                    <>
                                      <NumberFormat value={currentMonthly} /> /
                                      month
                                    </>
                                  ) : (
                                    '-'
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No city report data yet. Add properties with city addresses to
                  generate the report.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">
          No property cities found yet. Add property addresses first.
        </div>
      )}
    </Card>
  );
}
