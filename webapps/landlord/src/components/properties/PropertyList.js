import { EmptyIllustration } from '../../components/Illustrations';
import PropertyListItem from './PropertyListItem';
import useTranslation from 'next-translate/useTranslation';

/*
  PROPERTY LIST

  BEHAVIOR:
  - RENDERS GROUPED PROPERTIES (PARENT + CHILDREN AS UNITS)
  - KEEPS PARENT/CHILD RELATIONSHIPS INTACT ACROSS PAGINATIONS
  - PARENT PROPERTIES CAN BE ANY TYPE (BUILDING, COMPLEX, PORTFOLIO, ETC.)
  - PARENT PROPERTIES CALCULATE TOTAL RENT FROM ALL CHILDREN
  - SHOW STANDALONE PROPERTIES (NO PARENT, NO CHILDREN)
*/

export default function PropertyList({ data }) {
  const { t } = useTranslation('common');

  if (!data || data.length === 0) {
    return <EmptyIllustration label={t('No properties found')} />;
  }

  const parentGroups = data.filter((group) => group.type === 'parent-group');
  const standaloneGroups = data.filter((group) => group.type === 'standalone');

  return (
    <div className="space-y-8">
      {/*
        SECTION 1 — PARENT PROPERTIES WITH THEIR CHILDREN
      */}
      {parentGroups.map((group) => (
        <PropertyListItem
          key={group.parent._id}
          property={group.parent}
          childProperties={group.children}
          isChild={false}
        />
      ))}

      {/*
        SECTION 2 — STANDALONE PROPERTIES
        (NO PARENT, NO CHILDREN)
      */}
      {standaloneGroups.length > 0 && (
        <div>
          {standaloneGroups.length > 0 && parentGroups.length > 0 && (
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground">
              {t('Other properties')}
            </h3>
          )}
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {standaloneGroups.map((group) => (
              <PropertyListItem
                key={group.parent._id}
                property={group.parent}
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
