'use client';

import { useEffect, useRef, useState } from 'react';
import { useAzureMaps } from './hooks/useAzureMaps';

interface Address {
  street1?: string;
  street2?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface MapProps {
  address?: Address | string;
  className?: string;
}

export function PropertyMap({ address, className = 'w-full h-64' }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const {
    geocodeAddress,
    isAvailable: azureMapsAvailable,
    config
  } = useAzureMaps();

  // Load Azure Maps script
  useEffect(() => {
    if (!azureMapsAvailable || !mapContainer.current) return;

    // Check if Azure Maps is already loaded
    if ((window as any).atlas) {
      setMapReady(true);
      return;
    }

    // Load Azure Maps Web Control script
    const script = document.createElement('script');
    script.async = true;
    script.src =
      'https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.js';

    script.onload = () => {
      // Load Azure Maps services
      const servicesScript = document.createElement('script');
      servicesScript.async = true;
      servicesScript.src =
        'https://atlas.microsoft.com/sdk/javascript/service/2/atlas-service.min.js';
      servicesScript.onload = () => setMapReady(true);
      document.head.appendChild(servicesScript);
    };

    document.head.appendChild(script);

    // Load Azure Maps CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css';
    document.head.appendChild(link);
  }, [azureMapsAvailable]);

  // Initialize and update map when address changes
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapReady || !(window as any).atlas || !mapContainer.current) {
        return;
      }

      setLoading(true);

      try {
        let coordinates = null;

        if (address) {
          const result = await geocodeAddress(address);
          if (result) {
            coordinates = {
              lat: result.lat,
              lon: result.lon
            };
            setCenter(coordinates);
          }
        }

        // Initialize map if not already done
        if (!mapInstance.current) {
          const atlas = (window as any).atlas;
          mapInstance.current = new atlas.Map(mapContainer.current, {
            center: coordinates
              ? [coordinates.lon, coordinates.lat]
              : [-95, 40],
            zoom: coordinates ? 16 : 3,
            authOptions: {
              authType: 'subscriptionKey',
              subscriptionKey: config.apiKey
            }
          });

          mapInstance.current.events.add('ready', () => {
            if (coordinates) {
              const atlas = (window as any).atlas;
              // Add marker
              const dataSource = new atlas.source.DataSource();
              mapInstance.current.sources.add(dataSource);

              const point = new atlas.data.Point([
                coordinates.lon,
                coordinates.lat
              ]);
              dataSource.add(point);

              // Create a symbol layer for the marker
              const symbolLayer = new atlas.layer.SymbolLayer(
                dataSource,
                null,
                {
                  iconOptions: {
                    image: 'pin-red',
                    anchor: 'center'
                  }
                }
              );
              mapInstance.current.layers.add(symbolLayer);
            }
          });
        } else if (coordinates) {
          // Update existing map
          mapInstance.current.setCamera({
            center: [coordinates.lon, coordinates.lat],
            zoom: 16
          });

          // Clear existing layers and add new marker
          const atlas = (window as any).atlas;
          const sources = mapInstance.current.sources.toArray();
          if (sources.length > 0) {
            mapInstance.current.sources.remove(sources[0]);
          }

          const dataSource = new atlas.source.DataSource();
          mapInstance.current.sources.add(dataSource);

          const point = new atlas.data.Point([
            coordinates.lon,
            coordinates.lat
          ]);
          dataSource.add(point);

          const symbolLayer = new atlas.layer.SymbolLayer(dataSource, null, {
            iconOptions: {
              image: 'pin-red',
              anchor: 'center'
            }
          });
          mapInstance.current.layers.add(symbolLayer);
        }
      } catch (error) {
        console.error('Map initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeMap();
  }, [mapReady, address, geocodeAddress]);

  if (!azureMapsAvailable) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <p className="text-gray-500">Map service not available</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 z-10">
          <p className="text-gray-600">Loading map...</p>
        </div>
      )}
      {!center && !loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-gray-500">Location not found</p>
        </div>
      )}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
