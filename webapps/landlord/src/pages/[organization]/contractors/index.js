import { LuPencil, LuPlusCircle, LuStar, LuTrash } from 'react-icons/lu';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import useFillStore from '../../../hooks/useFillStore';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

function StarRating({ value = 0 }) {
  const safeValue = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((starValue) => (
        <LuStar
          key={starValue}
          className={`w-4 h-4 ${starValue <= safeValue ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground'}`}
        />
      ))}
    </div>
  );
}

async function fetchData(store) {
  return await store.contractor.fetch();
}

function Contractors() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const [searchText, setSearchText] = useState('');
  const [fetching] = useFillStore(fetchData, [router]);

  const filteredContractors = store.contractor.items.filter((contractor) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      contractor.name?.toLowerCase().includes(search) ||
      contractor.businessType?.toLowerCase().includes(search) ||
      contractor.company?.toLowerCase().includes(search)
    );
  });

  const handleNewContractor = useCallback(() => {
    router.push(`/${router.query.organization}/contractors/new`);
  }, [router]);

  const handleEdit = useCallback(
    (contractor) => {
      router.push(
        `/${router.query.organization}/contractors/${contractor._id}`
      );
    },
    [router]
  );

  const handleDelete = useCallback(
    async (contractorId) => {
      if (window.confirm(t('Are you sure?'))) {
        try {
          await store.contractor.delete([contractorId]);
          toast.success(t('Contractor deleted'));
        } catch (err) {
          toast.error(t('Error deleting contractor'));
        }
      }
    },
    [store, t]
  );

  return (
    <Page loading={fetching} dataCy="contractorsPage">
      <Card className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('Contractors')}</h1>
          <Button
            onClick={handleNewContractor}
            className="gap-2"
            dataCy="newContractorButton"
          >
            <LuPlusCircle className="w-4 h-4" />
            {t('New Contractor')}
          </Button>
        </div>

        <Input
          placeholder={t('Search')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        {filteredContractors.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {store.contractor.items.length === 0
              ? t('No contractors yet')
              : t('No results found')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-2">{t('Name')}</th>
                  <th className="text-left p-2">{t('Type')}</th>
                  <th className="text-left p-2">{t('Rating')}</th>
                  <th className="text-left p-2">{t('Contact')}</th>
                  <th className="text-right p-2">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredContractors.map((contractor) => (
                  <tr
                    key={contractor._id}
                    className="border-b hover:bg-muted/50"
                  >
                    <td className="p-2 font-medium">
                      <button
                        type="button"
                        className="text-blue-600 hover:underline"
                        onClick={() => handleEdit(contractor)}
                      >
                        {contractor.name}
                      </button>
                    </td>
                    <td className="p-2">{contractor.businessType || '-'}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <StarRating value={contractor.rating || 0} />
                        <span className="text-xs text-muted-foreground">
                          {Number(contractor.rating || 0).toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="p-2">
                      {contractor.contacts?.[0]?.phone ||
                        contractor.contacts?.[0]?.email ||
                        '-'}
                    </td>
                    <td className="p-2 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(contractor)}
                      >
                        <LuPencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(contractor._id)}
                      >
                        <LuTrash className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Page>
  );
}

export default withAuthentication(observer(Contractors));
