import { EmptyIllustration } from '../../components/Illustrations';
import PropertyListItem from './PropertyListItem';
import useTranslation from 'next-translate/useTranslation';

/*
  PROPERTY LIST

  BEHAVIOR:
  - GROUP PROPERTIES BY PARENT/CHILD RELATIONSHIP
  - SHOW PARENT PROPERTIES WITH EXPANDABLE/COLLAPSIBLE CHILDREN
  - PARENT PROPERTIES CALCULATE TOTAL RENT FROM ALL CHILDREN
  - SHOW STANDALONE PROPERTIES (NO PARENT, NOT A BUILDING)
*/

export default function PropertyList({ data }) {
  const { t } = useTranslation('common');

  if (!data || data.length === 0) {
    return <EmptyIllustration label={t('No properties found')} />;
  }

  // Create a map of all properties by ID for quick lookup
  const propertyMap = data.reduce((acc, property) => {
    acc[property._id] = property;
    return acc;
  }, {});

  // Identify parent IDs (all unique parentPropertyId values)
  const parentIds = new Set();
  data.forEach((property) => {
    if (property.parentPropertyId) {
      const parentId =
        typeof property.parentPropertyId === 'object' &&
        property.parentPropertyId._id
          ? property.parentPropertyId._id
          : property.parentPropertyId;
      parentIds.add(parentId);
    }
  });

  // Create a map of children by parent ID
  const childrenByParent = data.reduce((acc, property) => {
    if (property.parentPropertyId) {
      const parentId =
        typeof property.parentPropertyId === 'object' &&
        property.parentPropertyId._id
          ? property.parentPropertyId._id
          : property.parentPropertyId;

      if (!acc[parentId]) {
        acc[parentId] = [];
      }
      acc[parentId].push(property);
    }
    return acc;
  }, {});

  // Separate properties into:
  // 1. Parent properties (have children)
  // 2. Standalone properties (no parent, no children)
  const parentProperties = data.filter((p) => parentIds.has(p._id));
  const standaloneProperties = data.filter(
    (p) => !parentIds.has(p._id) && !p.parentPropertyId
  );

  return (
    <div className="space-y-8">
      {/*
        SECTION 1 — PARENT PROPERTIES WITH THEIR CHILDREN
      */}
      {parentProperties.map((parentProperty) => {
        const children = childrenByParent[parentProperty._id] || [];
        // Sort children by name for consistent display
        const sortedChildren = [...children].sort((a, b) =>
          (a.name || '').localeCompare(b.name || '')
        );

        return (
          <PropertyListItem
            key={parentProperty._id}
            property={parentProperty}
            childProperties={sortedChildren}
            isChild={false}
          />
        );
      })}

      {/*
        SECTION 2 — STANDALONE PROPERTIES
        (NO PARENT, NO CHILDREN)
      */}
      {standaloneProperties.length > 0 && (
        <div>
          {standaloneProperties.length > 0 && parentProperties.length > 0 && (
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground">
              {t('Other properties')}
            </h3>
          )}
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {standaloneProperties.map((property) => (
              <PropertyListItem
                key={property._id}
                property={property}
                childProperties={[]}
                isChild={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
