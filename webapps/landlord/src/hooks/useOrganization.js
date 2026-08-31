import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useStore } from '@/providers/StoreProvider';
import { fetchOrganization, QueryKeys } from '@/utils/restcalls';

export default function useOrganization() {
  const t = useTranslations('common');
  const store = useStore();
  const query = useQuery({
    queryKey: [QueryKeys.ORGANIZATION],
    queryFn: () => fetchOrganization(store),
    staleTime: Infinity
  });

  if (query.isError) {
    toast.error(t('Error fetching the organization'));
  }

  return query;
}
