import { EmptyIllustration } from '../../components/Illustrations';
import PropertyListItem from './PropertyListItem';
import useTranslation from 'next-translate/useTranslation';

/*
  PROPERTY LIST

  ORIGINAL BEHAVIOR:
  - FLAT GRID OF PROPERTIES (NO BUILDING / UNIT GROUPING)

  NEW BEHAVIOR:
  - GROUP PROPERTIES BY BUILDING
  - SHOW UNITS UNDER THEIR PARENT BUILDING
  - STILL SHOW STANDALONE PROPERTIES (NO PARENT, NOT A BUILDING)
*/

export default function PropertyList({ data }) {
  const { t } = useTranslation('common');

  if (!data || data.length === 0) {
    return <EmptyIllustration label={t('No properties found')} />;
  }

  /*
    SPLIT PROPERTIES INTO:
    - BUILDINGS
    - STANDALONE (NO PARENT, NOT BUILDINGS)
    - UNITS (HAVE parentPropertyId)
  */

  // ALL BUILDINGS (type === 'building')
  const buildings = data.filter((p) => p.type === 'building');

  // ALL UNITS (parentPropertyId SET)
  const unitsByBuilding = data.reduce((acc, p) => {
    if (p.parentPropertyId) {
      const key =
        typeof p.parentPropertyId === 'object' && p.parentPropertyId._id
          ? p.parentPropertyId._id
          : p.parentPropertyId;

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(p);
    }
    return acc;
  }, {});

  // STANDALONE PROPERTIES:
  // - NOT BUILDINGS
  // - NO parentPropertyId
  const standalone = data.filter(
    (p) => p.type !== 'building' && !p.parentPropertyId
  );

  return (
    <div className="space-y-8">
      {/*
        SECTION 1 — BUILDINGS WITH THEIR UNITS UNDERNEATH
      */}
      {buildings.map((building) => {
        const buildingId =
          typeof building.parentPropertyId === 'object' &&
          building.parentPropertyId?._id
            ? building._id
            : building._id;

        const childUnits = unitsByBuilding[buildingId] || [];

        return (
          <div key={building._id}>
            {/* BUILDING CARD (ORIGINAL COMPONENT, UNCHANGED) */}
            <PropertyListItem property={building} />

            {/* UNITS NESTED UNDER THIS BUILDING */}
            {childUnits.length > 0 && (
              <div className="ml-6 mt-2 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {childUnits.map((unit) => (
                  <PropertyListItem key={unit._id} property={unit} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/*
        SECTION 2 — STANDALONE PROPERTIES
        (NO PARENT, NOT MARKED AS BUILDING)
      */}
      {standalone.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">
            {t('Standalone properties')}
          </h3>
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {standalone.map((property) => (
              <PropertyListItem key={property._id} property={property} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
