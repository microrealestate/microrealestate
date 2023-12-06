import { Table, TableBody, TableCell, TableRow } from './ui/table';
import type { Document } from '@/types';
import getTranslation from '@/utils/i18n/server/getTranslation';
import { Label } from '@/components/ui/label';

export async function DocumentTable({ documents }: { documents: Document[] }) {
  const { t } = await getTranslation();

  return (
    <div className="flex flex-col gap-2">
      <Label>{t('Documents')}</Label>
      <Table>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id} className="hover:bg-inherit">
              <TableCell className="flex flex-col">
                <div>{document.name}</div>
                <div className="text-xs text-slate-500">
                  {document.description}
                </div>
              </TableCell>
              <TableCell className="w-5">{/* <DownLoadButton /> */}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
