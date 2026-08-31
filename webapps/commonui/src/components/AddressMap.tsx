'use client';

import axios from 'axios';
import { Marker, Map as PigeonMap } from 'pigeon-maps';
import { useEffect, useState } from 'react';
import Loading from './ui/Loading';

const nominatimBaseURL = 'https://nominatim.openstreetmap.org';

type AddressObject = {
  street1?: string;
  street2?: string;
  zipCode?: string;
  city?: string;
  country?: string;
};

type AddressMapProps = {
  address: string | AddressObject;
};

function buildQuery(parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

export default function AddressMap({ address }: AddressMapProps) {
  const [center, setCenter] = useState<[number, number] | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getLatLong = async () => {
      setLoading(true);

      if (address) {
        const queries: string[] = [];
        if (typeof address === 'object') {
          queries.push(
            buildQuery([
              address.street1,
              address.street2,
              address.zipCode,
              address.city,
              address.country
            ])
          );

          if (address.street2) {
            queries.push(
              buildQuery([
                address.street2,
                address.zipCode,
                address.city,
                address.country
              ])
            );
          }

          queries.push(
            buildQuery([address.zipCode, address.city, address.country]),
            buildQuery([address.city, address.country])
          );
        } else {
          queries.push(address);
        }

        for (const query of queries) {
          if (!query.trim()) continue;

          try {
            const response = await axios.get(
              `${nominatimBaseURL}/search?format=jsonv2&q=${encodeURIComponent(query)}`
            );

            if (response.data?.[0]?.lat && response.data?.[0]?.lon) {
              setCenter([
                Number(response.data[0].lat),
                Number(response.data[0].lon)
              ]);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error(error);
          }
        }
      }

      setCenter(undefined);
      setLoading(false);
    };

    getLatLong();
  }, [address]);

  return (
    <div className="flex items-center justify-center w-full h-64">
      {loading ? (
        <Loading fullScreen={false} />
      ) : center ? (
        <PigeonMap height={256} center={center} zoom={16}>
          <Marker
            height={35}
            width={35}
            color="var(--primary)"
            anchor={center}
          />
        </PigeonMap>
      ) : null}
    </div>
  );
}
