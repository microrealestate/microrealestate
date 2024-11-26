import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../utils';
import { EmptyIllustration } from '../Illustrations';
import { GrDocumentCsv } from 'react-icons/gr';
import moment from 'moment';
import NumberFormat from '../NumberFormat';
import PropertyIcon from '../properties/PropertyIcon';
import { StoreContext } from '../../store';
import { useContext } from 'react';
import useTranslation from 'next-translate/useTranslation';

export default function OutgoingTenants({ onCSVClick }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const hasData = !!store.accounting?.filteredData?.outgoingTenants?.length;

  return hasData ? (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center text-lg md:text-xl">
          {t('Outgoing tenants')}
          <Button variant="ghost" size="icon" onClick={onCSVClick}>
            <GrDocumentCsv className="size-6" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {store.accounting.filteredData.outgoingTenants.map((tenant) => (
          <div
            key={tenant._id}
            className={cn(
              'flex flex-col md:flex-row md:justify-between gap-2',
              'border-b first:border-t last:border-none py-2'
            )}
          >
            <div>
              <div className="text-xl">{tenant.name}</div>
              <div className="text-muted-foreground">
                {moment(tenant.beginDate).format('L')} -{' '}
                {tenant.terminationDate
                  ? moment(tenant.terminationDate).format('L')
                  : moment(tenant.endDate).format('L')}
              </div>
              <div className="flex items-center flex-wrap gap-2 md:text-xl my-4">
                {tenant.properties.map((property) => (
                  <div
                    className="flex items-center gap-1 text-xs text-muted-foreground"
                    key={property._id}
                  >
                    <PropertyIcon type={property.type} />
                    <span>{property.name}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-muted-foreground text-xs">
                  {t('Deposit')}
                </div>
                <div>
                  <NumberFormat value={tenant.guaranty} />
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">
                  {t('Deposit reimbursement')}
                </div>
                <div>
                  <NumberFormat value={tenant.guarantyPayback} />
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">
                  {t('Last rent balance')}
                </div>
                <div>
                  <NumberFormat value={tenant.balance} />
                </div>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs md:text-right">
                {t('Final balance')}
              </div>
              <NumberFormat
                value={tenant.finalBalance}
                withColor
                showZero={true}
                className="text-2xl md:text-right"
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  ) : (
    <EmptyIllustration />
  );
}
