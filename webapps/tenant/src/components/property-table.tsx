import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import getTranslation from '@/utils/i18n/server/getTranslation';
import { Label } from '@/components/ui/label';
import type { Property } from '@/types';

export async function PropertyTable({
  properties,
}: {
  properties: Property[];
}) {
  const { t } = await getTranslation();

  return (
    <div className="flex flex-col gap-2">
      <Label>{t('Properties')}</Label>
      <Table>
        <TableBody>
          {properties.map((property) => (
            <TableRow key={property.id} className="hover:bg-inherit">
              <TableCell className="flex flex-col">
                <div>{property.name}</div>
                <div className="text-xs text-slate-500">
                  {property.description}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
