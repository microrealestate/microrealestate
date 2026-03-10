import { useCallback, useState } from 'react';
import axios from 'axios';
import { getAzureMapsConfig } from '../utils/azureMapsConfig';

/**
 * Custom hook for Azure Maps geocoding and routing
 */
export const useAzureMaps = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const config = getAzureMapsConfig();

  /**
   * Geocode an address to get coordinates
   * @param {string|object} address - Address string or object with address parts
   * @returns {Promise<{lat: number, lon: number}>}
   */
  const geocodeAddress = useCallback(
    async (address) => {
      if (!config.apiKey) {
        setError('Azure Maps API Key not configured');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        let queryAddress;
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

        console.log('Geocoding address:', { address, queryAddress });

        if (!queryAddress || queryAddress.trim() === '') {
          setError('Address is empty');
          console.warn('Address is empty, cannot geocode');
          return null;
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
        setError(err.message || 'Geocoding failed');
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
   * @param {object} from - Starting location {lat, lon}
   * @param {object} to - Destination location {lat, lon}
   * @returns {Promise<{distance: number, duration: number, points: array}>}
   */
  const getRoute = useCallback(
    async (from, to) => {
      if (!config.apiKey) {
        setError('Azure Maps API Key not configured');
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
            points: route.legs.flatMap((leg) =>
              leg.points.map((p) => ({
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
        setError(err.message || 'Routing failed');
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
