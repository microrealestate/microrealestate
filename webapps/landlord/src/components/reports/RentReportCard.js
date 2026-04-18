import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from 'recharts';

import { Card } from '../ui/card';
import { ChartContainer } from '../ui/chart';
import {
  getPropertySurfaceSqm,
  sqmToSqft
} from '../../utils/surfaceConversion';
import { default as NumberFormat } from '../NumberFormat';

function toMonthlyRate(annualSqftRate, squareFeet) {
  const parsedRate = Number(annualSqftRate);
  if (!parsedRate || !squareFeet) {
    return null;
  }

  return (parsedRate * squareFeet) / 12;
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

function buildPropertyRows(cityList, cityRentEstimates, properties) {
  const propertiesByCity = (properties || []).reduce((accumulator, property) => {
    const city = property?.address?.city?.trim();
    if (!city) {
      return accumulator;
    }

    const normalizedCity = city.toLowerCase();
    if (!accumulator[normalizedCity]) {
      accumulator[normalizedCity] = [];
    }

    accumulator[normalizedCity].push(property);
    return accumulator;
  }, {});

  return cityList
    .map((city) => {
      const cityProperties = propertiesByCity[city.toLowerCase()] || [];
      const cityRange = cityRentEstimates[city];

      const propertiesReport = cityProperties.map((property) => {
        const squareFeet = sqmToSqft(getPropertySurfaceSqm(property, properties || []));
        const lowMonthly = toMonthlyRate(cityRange.low, squareFeet) || 0;
        const mediumMonthly = toMonthlyRate(cityRange.medium, squareFeet) || 0;
        const highMonthly = toMonthlyRate(cityRange.high, squareFeet) || 0;
        const currentMonthly = Number(property?.price);

        return {
          property,
          squareFeet,
          lowMonthly,
          mediumMonthly,
          highMonthly,
          currentMonthly,
          statusBadge: getRentStatusBadge(currentMonthly, lowMonthly, highMonthly),
          positionLabel: getRentPositionLabel(
            currentMonthly,
            lowMonthly,
            mediumMonthly,
            highMonthly
          ),
          chartData: [
            { label: 'Low', value: lowMonthly, fill: 'hsl(var(--chart-3))' },
            { label: 'Medium', value: mediumMonthly, fill: 'hsl(var(--chart-2))' },
            { label: 'High', value: highMonthly, fill: 'hsl(var(--chart-1))' },
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
}

export default function RentReportCard({ cityList, cityRentEstimates, properties }) {
  const reportByCity = buildPropertyRows(cityList, cityRentEstimates, properties);

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Rent report</h3>
        <p className="text-sm text-muted-foreground">
          Compare each property&apos;s current monthly rent against the low, medium,
          and high monthly estimate for its city.
        </p>
      </div>

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
                    <div key={property._id} className="rounded border border-dashed p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-medium">{property.name}</div>
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
                          <span className="text-muted-foreground">Position:</span>
                          <span className="font-medium">{positionLabel}</span>
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
                          margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                        >
                          <XAxis dataKey="label" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} width={70} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry) => (
                              <Cell key={`${property._id}-${entry.label}`} fill={entry.fill} />
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
                          <span className="text-muted-foreground">Low:</span>{' '}
                          <NumberFormat value={lowMonthly} /> / month
                        </div>
                        <div>
                          <span className="text-muted-foreground">Medium:</span>{' '}
                          <NumberFormat value={mediumMonthly} /> / month
                        </div>
                        <div>
                          <span className="text-muted-foreground">High:</span>{' '}
                          <NumberFormat value={highMonthly} /> / month
                        </div>
                        <div>
                          <span className="text-muted-foreground">Current:</span>{' '}
                          {Number.isFinite(currentMonthly) ? (
                            <>
                              <NumberFormat value={currentMonthly} /> / month
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
          No city report data yet. Add properties with city addresses to generate the report.
        </div>
      )}
    </Card>
  );
}