import { EmptyIllustration } from '../../components/Illustrations';
import PropertyListItem from './PropertyListItem';
import useTranslation from 'next-translate/useTranslation';

export default function PropertyList({ data }) {
  const { t } = useTranslation('common');

  return data.length > 0 ? (
    <ul>
      {data.map((property) => (
        <li key={property._id} className="mb-3 last:mb-0">
          <PropertyListItem property={property} />
        </li>
      ))}
    </ul>
  ) : (
    <EmptyIllustration label={t('No properties found')} />
  );
}
