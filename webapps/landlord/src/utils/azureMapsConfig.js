/**
 * Azure Maps Configuration
 *
 * This module manages Azure Maps API configuration for Microsoft Entra ID authentication.
 */

export const getAzureMapsConfig = () => {
  // Azure Maps Subscription Key (API Key)
  const apiKey = process.env.NEXT_PUBLIC_AZURE_MAPS_API_KEY || '';

  if (!apiKey) {
    console.warn(
      'Azure Maps API Key is not configured. Set NEXT_PUBLIC_AZURE_MAPS_API_KEY environment variable.'
    );
  }

  return {
    apiKey: apiKey || '',
    authType: 'subscriptionKey', // Using Subscription Key authentication
    baseUrl: 'https://atlas.microsoft.com',
    version: '1',
    // Routing service configuration
    routing: {
      enabled: !!apiKey,
      routeType: 'fastest' // Can be 'fastest', 'shortest', or 'eco'
    },
    // Search service configuration
    search: {
      enabled: !!apiKey,
      language: 'en-EN'
    }
  };
};

/**
 * Get Azure Maps URLs for various services
 */
export const getAzureMapsUrls = (apiKey) => {
  const baseUrl = 'https://atlas.microsoft.com';
  return {
    maps: `${baseUrl}/map/staticimage?&api-version=2`,
    search: `${baseUrl}/search/address/json?&api-version=1`,
    routing: `${baseUrl}/route/directions/json?&api-version=1`,
    timezone: `${baseUrl}/timezone/byCoordinates/json?&api-version=1`
  };
};
