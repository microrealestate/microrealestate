import { EmptyIllustration } from '../../components/Illustrations';
import PropertyListItem from './PropertyListItem';
import useTranslation from 'next-translate/useTranslation';

export default function PropertyList({ data }) {
  const { t } = useTranslation('common');

  return data.length > 0 ? (
    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {data.map((property) => (
        <PropertyListItem key={property._id} property={property} />
      ))}
    </div>
  ) : (
    <EmptyIllustration label={t('No properties found')} />
  );
}
