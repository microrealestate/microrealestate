import { useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiFetcher } from '../../../utils/fetch';
import { sqmToSqft } from '../../../utils/surfaceConversion';
import {
  getPresetCity,
  loadCityRentRanges,
  mergeCityRentRanges,
  normalizeCityRange
} from '../../../components/properties/CityEstimatesCard';
import { withAuthentication } from '../../../components/Authentication';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';

function toCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatPropertyLabel(property, propertyById) {
  if (!property) {
    return 'Unknown property';
  }

  const parentId =
    typeof property.parentPropertyId === 'object'
      ? property.parentPropertyId?._id
      : property.parentPropertyId;

  if (!parentId) {
    return property.name || 'Unnamed property';
  }

  const parent = propertyById[String(parentId)];
  if (!parent) {
    return property.name || 'Unnamed property';
  }

  return `${parent.name} / ${property.name}`;
}

function buildFlyerPrintMarkup(summary, emailDraft, imageUrls) {
  const safeEmailHtml = String(emailDraft || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${summary.propertyLabel} - Space Flyer</title>
    <style>
      @page { margin: 0.5in; size: Letter; }
      body { font-family: Georgia, 'Times New Roman', serif; margin: 0; color: #1f2937; }
      .flyer { max-width: 8.5in; margin: 0 auto; }
      .title { font-size: 26px; margin: 0 0 16px 0; letter-spacing: 0.4px; }
      .hero { width: 100%; height: 240px; object-fit: cover; border-radius: 8px; background: #f3f4f6; }
      .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; margin-top: 14px; }
      .facts { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background: #fafafa; }
      .fact { display: flex; justify-content: space-between; font-size: 14px; margin: 6px 0; gap: 12px; }
      .fact strong { font-weight: 700; }
      .floor { width: 100%; height: 220px; object-fit: contain; border: 1px solid #e5e7eb; border-radius: 8px; background: white; }
      .email { margin-top: 12px; font-size: 14px; line-height: 1.4; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    </style>
  </head>
  <body>
    <div class="flyer">
      <h1 class="title">${summary.propertyLabel}</h1>
      <img class="hero" src="${imageUrls.coverPhotoUrl || ''}" alt="Main property" />
      <div class="grid">
        <div class="facts">
          <div class="fact"><span>Space</span><strong>${Number(summary.spaceSquareFeet || 0).toFixed(0)} sq ft</strong></div>
          <div class="fact"><span>Asking Rate</span><strong>${toCurrency(imageUrls.askingRate ?? summary.askingRentPerSqftYearHigh)} / sq ft / year</strong></div>
          <div class="fact"><span>Lease Type</span><strong>${summary.leaseType || 'NNN'}</strong></div>
          <div class="fact"><span>Property Tax (est.)</span><strong>${toCurrency(summary.monthlyTaxEstimate)} / month</strong></div>
          <div class="fact"><span>Insurance (est.)</span><strong>${toCurrency(summary.monthlyInsuranceEstimate)} / month</strong></div>
          <div class="email">${safeEmailHtml}</div>
        </div>
        <div>
          <img class="floor" src="${imageUrls.floorPlanUrl || ''}" alt="Floor plan" />
        </div>
      </div>
    </div>
  </body>
</html>
`;
}

function buildEmailTemplate(summary, askingRate) {
  if (!summary) {
    return '';
  }

  return `${summary.propertyLabel}:\n\nThe space is ${Number(
    summary.spaceSquareFeet || 0
  ).toFixed(0)} square feet, and we are asking $${Number(askingRate || 0).toFixed(
    2
  )} per square foot per year under a ${summary.leaseType || 'NNN'} lease. Based on last year's figures, property taxes were approximately $${Number(
    summary.monthlyTaxEstimate || 0
  ).toFixed(2)} per month, and insurance is estimated at around $${Number(
    summary.monthlyInsuranceEstimate || 0
  ).toFixed(2)} per month.\n\n${
    summary.availabilitySentence ||
    "I'm available to show the space in the evenings or on weekends."
  }\n\nPlease let me know if you have any additional questions.\nThank you`;
}

function resolveRateContext(summary, selectedProperty, parentProperty, cityRentEstimates) {
  const cityName = String(
    selectedProperty?.address?.city || parentProperty?.address?.city || ''
  ).trim();
  const presetCity = getPresetCity(cityName, cityRentEstimates);
  const cityRange = presetCity
    ? normalizeCityRange(cityRentEstimates[presetCity])
    : null;

  const summaryHigh = toNumber(summary?.askingRentPerSqftYearHigh, 0);
  const inheritedHigh = toNumber(
    selectedProperty?.rentHighSqftYear,
    toNumber(parentProperty?.rentHighSqftYear, undefined)
  );
  const propertyHigh = toNumber(inheritedHigh, toNumber(cityRange?.high, summaryHigh));
  const propertyMedian = toNumber(
    selectedProperty?.rentMedianSqftYear,
    toNumber(
      parentProperty?.rentMedianSqftYear,
      toNumber(cityRange?.medium, propertyHigh)
    )
  );
  const propertyLow = toNumber(
    selectedProperty?.rentLowSqftYear,
    toNumber(
      parentProperty?.rentLowSqftYear,
      toNumber(cityRange?.low, propertyHigh)
    )
  );

  return {
    propertyHigh,
    propertyMedian,
    propertyLow,
    cityHigh: toNumber(cityRange?.high, propertyHigh),
    cityMedian: toNumber(cityRange?.medium, propertyMedian),
    cityLow: toNumber(cityRange?.low, propertyLow)
  };
}

function MarketingPage() {
  const store = useContext(StoreContext);
  const organizationName = store.organization.selected?.name;
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [draftVersion, setDraftVersion] = useState(0);
  const [emailDraft, setEmailDraft] = useState('');
  const [askingRateMode, setAskingRateMode] = useState('high');
  const [manualAskingRate, setManualAskingRate] = useState('');
  const [cityRentEstimates, setCityRentEstimates] = useState(() =>
    mergeCityRentRanges()
  );
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('');
  const [floorPlanUrl, setFloorPlanUrl] = useState('');

  useEffect(() => {
    const storedRanges = loadCityRentRanges(organizationName);
    setCityRentEstimates(mergeCityRentRanges(storedRanges));
  }, [organizationName]);

  const propertiesQuery = useQuery({
    queryKey: ['marketing-properties'],
    queryFn: async () => {
      const response = await apiFetcher().get('/properties');
      return response.data || [];
    }
  });

  const propertyById = useMemo(() => {
    return (propertiesQuery.data || []).reduce((acc, property) => {
      acc[String(property._id)] = property;
      return acc;
    }, {});
  }, [propertiesQuery.data]);

  const propertyOptions = useMemo(() => {
    return [...(propertiesQuery.data || [])].sort((left, right) =>
      formatPropertyLabel(left, propertyById).localeCompare(
        formatPropertyLabel(right, propertyById)
      )
    );
  }, [propertiesQuery.data, propertyById]);

  useEffect(() => {
    if (!selectedSpaceId && propertyOptions.length) {
      setSelectedSpaceId(String(propertyOptions[0]._id));
    }
  }, [propertyOptions, selectedSpaceId]);

  const spaceSummaryQuery = useQuery({
    queryKey: ['space-marketing-summary', selectedSpaceId, draftVersion],
    enabled: Boolean(selectedSpaceId),
    queryFn: async () => {
      const response = await apiFetcher().get('/reports/space-marketing-summary', {
        params: {
          propertyId: selectedSpaceId
        }
      });
      return response.data;
    }
  });

  useEffect(() => {
    const summary = spaceSummaryQuery.data;
    if (!summary) {
      setEmailDraft('');
      setManualAskingRate('');
      return;
    }

    const selectedProperty = propertyById[String(selectedSpaceId)];
    const parentProperty = selectedProperty?.parentPropertyId
      ? propertyById[
          String(
            typeof selectedProperty.parentPropertyId === 'object'
              ? selectedProperty.parentPropertyId?._id
              : selectedProperty.parentPropertyId
          )
        ]
      : null;

    const { propertyHigh } = resolveRateContext(
      summary,
      selectedProperty,
      parentProperty,
      cityRentEstimates
    );

    setManualAskingRate(propertyHigh ? String(propertyHigh) : '');
    setEmailDraft(buildEmailTemplate(summary, propertyHigh));
  }, [
    spaceSummaryQuery.data,
    propertyById,
    selectedSpaceId,
    cityRentEstimates
  ]);

  const selectedAskingRate = useMemo(() => {
    const summary = spaceSummaryQuery.data;
    if (!summary) {
      return 0;
    }

    const selectedProperty = propertyById[String(selectedSpaceId)];
    const parentProperty = selectedProperty?.parentPropertyId
      ? propertyById[
          String(
            typeof selectedProperty.parentPropertyId === 'object'
              ? selectedProperty.parentPropertyId?._id
              : selectedProperty.parentPropertyId
          )
        ]
      : null;

    const {
      propertyHigh,
      propertyMedian,
      propertyLow,
      cityHigh,
      cityMedian,
      cityLow
    } = resolveRateContext(summary, selectedProperty, parentProperty, cityRentEstimates);

    if (askingRateMode === 'manual') {
      return toNumber(manualAskingRate, propertyHigh);
    }

    if (askingRateMode === 'city-high') {
      return cityHigh;
    }

    if (askingRateMode === 'city-median') {
      return cityMedian;
    }

    if (askingRateMode === 'city-low') {
      return cityLow;
    }

    if (askingRateMode === 'median') {
      return propertyMedian;
    }

    if (askingRateMode === 'low') {
      return propertyLow;
    }

    return propertyHigh;
  }, [
    spaceSummaryQuery.data,
    askingRateMode,
    manualAskingRate,
    propertyById,
    selectedSpaceId,
    cityRentEstimates
  ]);

  function handleApplyAskingRate() {
    const summary = spaceSummaryQuery.data;
    if (!summary) {
      return;
    }

    setEmailDraft(buildEmailTemplate(summary, selectedAskingRate));
    toast.success('Asking rate applied to marketing output');
  }

  useEffect(() => {
    let disposed = false;
    let nextCoverUrl = '';
    let nextFloorUrl = '';

    const loadImages = async () => {
      const summary = spaceSummaryQuery.data;
      if (!summary) {
        setCoverPhotoUrl('');
        setFloorPlanUrl('');
        return;
      }

      try {
        if (summary.coverPhotoAttachmentId) {
          const response = await apiFetcher().get(
            `/attachments/${summary.coverPhotoAttachmentId}/download`,
            { responseType: 'blob' }
          );
          nextCoverUrl = window.URL.createObjectURL(response.data);
        }

        if (summary.floorPlanAttachmentId) {
          const response = await apiFetcher().get(
            `/attachments/${summary.floorPlanAttachmentId}/download`,
            { responseType: 'blob' }
          );
          nextFloorUrl = window.URL.createObjectURL(response.data);
        }

        if (!disposed) {
          setCoverPhotoUrl(nextCoverUrl);
          setFloorPlanUrl(nextFloorUrl);
        }
      } catch {
        if (!disposed) {
          setCoverPhotoUrl('');
          setFloorPlanUrl('');
        }
      }
    };

    loadImages();

    return () => {
      disposed = true;
      if (nextCoverUrl) {
        window.URL.revokeObjectURL(nextCoverUrl);
      }
      if (nextFloorUrl) {
        window.URL.revokeObjectURL(nextFloorUrl);
      }
    };
  }, [spaceSummaryQuery.data]);

  async function copyEmailDraft() {
    if (!emailDraft) {
      return;
    }

    try {
      await navigator.clipboard.writeText(emailDraft);
      toast.success('Email draft copied');
    } catch {
      toast.error('Unable to copy draft');
    }
  }

  function handlePrintFlyer() {
    const summary = spaceSummaryQuery.data;
    if (!summary) {
      return;
    }

    const popup = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=900');
    if (!popup) {
      toast.error('Please allow popups to print the flyer');
      return;
    }

    popup.document.open();
    popup.document.write(
      buildFlyerPrintMarkup(summary, emailDraft, {
        coverPhotoUrl,
        floorPlanUrl,
        askingRate: selectedAskingRate
      })
    );
    popup.document.close();
    popup.focus();
    popup.print();
  }

  return (
    <Page
      loading={propertiesQuery.isLoading || spaceSummaryQuery.isLoading}
      dataCy="marketingPage"
    >
      <Card className="p-4 mb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex flex-col gap-1 md:min-w-80">
            <label className="text-sm text-muted-foreground">Space for marketing output</label>
            <select
              className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              value={selectedSpaceId}
              onChange={(event) => setSelectedSpaceId(event.target.value)}
            >
              {propertyOptions.map((property) => (
                <option key={String(property._id)} value={String(property._id)}>
                  {formatPropertyLabel(property, propertyById)}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDraftVersion((value) => value + 1)}
            disabled={!selectedSpaceId}
          >
            Regenerate
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={copyEmailDraft}
            disabled={!emailDraft}
          >
            Copy email template
          </Button>
          <Button
            type="button"
            onClick={handlePrintFlyer}
            disabled={!spaceSummaryQuery.data}
          >
            Print / Save flyer PDF
          </Button>
        </div>

        {spaceSummaryQuery.data ? (
          <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="rounded border p-3 text-sm">
                <div className="font-medium mb-2">Marketing facts</div>
                <div>
                  Space:{' '}
                  {Number(
                    spaceSummaryQuery.data.spaceSquareFeet ||
                      sqmToSqft(spaceSummaryQuery.data.spaceSquareMeters || 0)
                  ).toFixed(0)}{' '}
                  sq ft
                </div>
                <div>
                  Asking rate: {toCurrency(selectedAskingRate)} / sq ft / year
                </div>
                <div>Lease type: {spaceSummaryQuery.data.leaseType || 'NNN'}</div>
                <div>Monthly tax est.: {toCurrency(spaceSummaryQuery.data.monthlyTaxEstimate)}</div>
                <div>
                  Monthly insurance est.: {toCurrency(spaceSummaryQuery.data.monthlyInsuranceEstimate)}
                </div>
              </div>

              <div className="rounded border p-3 text-sm space-y-3">
                <div className="font-medium">Asking rate source</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Rate option</label>
                    <select
                      className="mt-1 w-full h-10 rounded-md border bg-background px-3 text-sm"
                      value={askingRateMode}
                      onChange={(event) => setAskingRateMode(event.target.value)}
                    >
                      <option value="high">High (default)</option>
                      <option value="median">Median</option>
                      <option value="low">Low</option>
                      <option value="city-high">City high estimate</option>
                      <option value="city-median">City medium estimate</option>
                      <option value="city-low">City low estimate</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Manual rate ($/sq ft/year)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={askingRateMode !== 'manual'}
                      className="mt-1 w-full h-10 rounded-md border bg-background px-3 text-sm disabled:opacity-60"
                      value={manualAskingRate}
                      onChange={(event) => setManualAskingRate(event.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={handleApplyAskingRate}>
                    Apply rate to output
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    Active asking rate: {toCurrency(selectedAskingRate)} / sq ft / year
                  </div>
                </div>
              </div>

              {(spaceSummaryQuery.data.mediaWarnings || []).length ? (
                <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  {(spaceSummaryQuery.data.mediaWarnings || []).join(' | ')}
                </div>
              ) : null}

              <label className="text-sm text-muted-foreground">Email template (editable)</label>
              <textarea
                className="w-full min-h-72 rounded-md border bg-background p-3 text-sm"
                value={emailDraft}
                onChange={(event) => setEmailDraft(event.target.value)}
              />
            </div>

            <div className="rounded border p-3 bg-white">
              <div className="text-xl font-semibold mb-2">{spaceSummaryQuery.data.propertyLabel}</div>
              {coverPhotoUrl ? (
                <img
                  src={coverPhotoUrl}
                  alt="Main property"
                  className="w-full h-56 object-cover rounded border bg-muted"
                />
              ) : (
                <div className="w-full h-56 rounded border bg-muted flex items-center justify-center text-sm text-muted-foreground">
                  Main picture missing
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                <div className="rounded border p-2">
                  <div className="text-xs text-muted-foreground">Space</div>
                  <div className="font-medium">
                    {Number(spaceSummaryQuery.data.spaceSquareFeet || 0).toFixed(0)} sq ft
                  </div>
                </div>
                <div className="rounded border p-2">
                  <div className="text-xs text-muted-foreground">Asking rate</div>
                  <div className="font-medium">
                    {toCurrency(selectedAskingRate)} / sq ft / year
                  </div>
                </div>
                <div className="rounded border p-2">
                  <div className="text-xs text-muted-foreground">Property tax est.</div>
                  <div className="font-medium">
                    {toCurrency(spaceSummaryQuery.data.monthlyTaxEstimate)} / month
                  </div>
                </div>
                <div className="rounded border p-2">
                  <div className="text-xs text-muted-foreground">Insurance est.</div>
                  <div className="font-medium">
                    {toCurrency(spaceSummaryQuery.data.monthlyInsuranceEstimate)} / month
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xs text-muted-foreground mb-1">Floor plan</div>
                {floorPlanUrl ? (
                  <img
                    src={floorPlanUrl}
                    alt="Floor plan"
                    className="w-full h-52 object-contain rounded border bg-muted"
                  />
                ) : (
                  <div className="w-full h-52 rounded border bg-muted flex items-center justify-center text-sm text-muted-foreground">
                    Floor plan missing
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Card>
    </Page>
  );
}

export default withAuthentication(MarketingPage);
