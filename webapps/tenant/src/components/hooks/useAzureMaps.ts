import { useCallback, useState } from 'react';
import axios from 'axios';
import { getAzureMapsConfig } from '@/utils/azureMapsConfig';

interface Coordinates {
  lat: number;
  lon: number;
}

interface GeocodeResult extends Coordinates {
  address?: string;
}

interface RouteResult {
  distance: number;
  duration: number;
  points: Coordinates[];
  summary: any;
}

/**
 * Custom hook for Azure Maps geocoding and routing
 */
export const useAzureMaps = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = getAzureMapsConfig();

  /**
   * Geocode an address to get coordinates
   */
  const geocodeAddress = useCallback(
    async (
      address: string | Record<string, any>
    ): Promise<GeocodeResult | null> => {
      if (!config.apiKey) {
        setError('Azure Maps API key not configured');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        let queryAddress: string;
        if (typeof address === 'object') {
          queryAddress = [
            address.street1,
            address.street2,
            address.zipCode,
            address.city,
            address.state,
            address.country
          ]
            .filter(Boolean)
            .join(', ');
        } else {
          queryAddress = address;
        }

        const response = await axios.get(
          'https://atlas.microsoft.com/search/address/json',
          {
            params: {
              'api-version': '1.0',
              query: queryAddress,
              'subscription-key': config.apiKey
            }
          }
        );

        if (response.data?.results && response.data.results.length > 0) {
          const result = response.data.results[0];
          return {
            lat: result.position.lat,
            lon: result.position.lon,
            address: result.address?.freeformAddress || queryAddress
          };
        }

        setError('Address not found');
        return null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Geocoding failed';
        setError(errorMessage);
        console.error('Azure Maps geocoding error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [config.apiKey]
  );

  /**
   * Get route between two locations
   */
  const getRoute = useCallback(
    async (from: Coordinates, to: Coordinates): Promise<RouteResult | null> => {
      if (!config.apiKey) {
        setError('Azure Maps API key not configured');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          'https://atlas.microsoft.com/route/directions/json',
          {
            params: {
              'api-version': '1.0',
              query: `${from.lat},${from.lon}:${to.lat},${to.lon}`,
              'subscription-key': config.apiKey,
              routeType: config.routing.routeType
            }
          }
        );

        if (response.data?.routes && response.data.routes.length > 0) {
          const route = response.data.routes[0];
          return {
            distance: route.summary.lengthInMeters,
            duration: route.summary.travelTimeInSeconds,
            points: route.legs.flatMap((leg: any) =>
              leg.points.map((p: any) => ({
                lat: p.latitude,
                lon: p.longitude
              }))
            ),
            summary: route.summary
          };
        }

        setError('No route found');
        return null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Routing failed';
        setError(errorMessage);
        console.error('Azure Maps routing error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [config.apiKey, config.routing.routeType]
  );

  return {
    loading,
    error,
    geocodeAddress,
    getRoute,
    config,
    isAvailable: !!config.apiKey
  };
};
