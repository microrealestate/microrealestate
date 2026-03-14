import { useCallback, useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetcher } from '../../../utils/fetch';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../components/ui/select';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

const ACTION_COLORS = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800'
};

const ENTITY_LABELS = {
  property: 'Property',
  lease: 'Lease / Contract',
  utility: 'Utility',
  tax: 'Property Tax'
};

const PAGE_SIZE = 50;

async function fetchAuditLogs(
  organizationId,
  accessToken,
  { entityType, action, skip }
) {
  const params = new URLSearchParams({ limit: PAGE_SIZE, skip });
  if (entityType && entityType !== 'all') params.set('entityType', entityType);
  if (action && action !== 'all') params.set('action', action);

  const response = await apiFetcher().get(`/api/v2/audit-logs?${params}`, {
    headers: { organizationid: organizationId }
  });
  return response.data;
}

function UserLogs() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [skip, setSkip] = useState(0);
  const [expandedLog, setExpandedLog] = useState(null);

  const orgId = store.organization.selected?._id;
  const accessToken = store.user.token;

  const logsQuery = useQuery({
    queryKey: ['audit-logs', orgId, entityTypeFilter, actionFilter, skip],
    queryFn: () =>
      fetchAuditLogs(orgId, accessToken, {
        entityType: entityTypeFilter,
        action: actionFilter,
        skip
      }),
    enabled: !!orgId,
    onError: () => toast.error(t('Error fetching user logs'))
  });

  const handleFilterChange = useCallback(() => {
    setSkip(0);
    setExpandedLog(null);
  }, []);

  const logs = logsQuery.data?.logs || [];
  const total = logsQuery.data?.total || 0;

  return (
    <Page dataCy="userLogsPage">
      <Card>
        <CardHeader>
          <CardTitle>{t('User Activity Logs')}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Select
              value={entityTypeFilter}
              onValueChange={(v) => {
                setEntityTypeFilter(v);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t('All categories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All categories')}</SelectItem>
                <SelectItem value="property">{t('Properties')}</SelectItem>
                <SelectItem value="lease">{t('Contracts')}</SelectItem>
                <SelectItem value="utility">{t('Utilities')}</SelectItem>
                <SelectItem value="tax">{t('Property Taxes')}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={actionFilter}
              onValueChange={(v) => {
                setActionFilter(v);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t('All actions')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All actions')}</SelectItem>
                <SelectItem value="create">{t('Created')}</SelectItem>
                <SelectItem value="update">{t('Updated')}</SelectItem>
                <SelectItem value="delete">{t('Deleted')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Log table */}
          {logsQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">{t('Loading...')}</p>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t('No activity found.')}
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="rounded border p-3 hover:bg-muted/40 cursor-pointer"
                  onClick={() =>
                    setExpandedLog(expandedLog === log._id ? null : log._id)
                  }
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}
                    >
                      {log.action}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {ENTITY_LABELS[log.entityType] || log.entityType}
                    </Badge>
                    <span className="font-medium truncate max-w-xs">
                      {log.entityName || log.entityId}
                    </span>
                    <span className="text-muted-foreground ml-auto text-xs whitespace-nowrap">
                      {log.userFullName || log.userEmail || t('Unknown user')}
                    </span>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleString()
                        : ''}
                    </span>
                  </div>

                  {/* Expanded change details */}
                  {expandedLog === log._id && log.changes?.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                        {t('Changed fields')}
                      </p>
                      <div className="flex flex-col gap-1">
                        {log.changes.map((change, i) => (
                          <div
                            key={i}
                            className="grid grid-cols-[1fr_1fr_1fr] gap-2 text-xs font-mono bg-muted/50 rounded px-2 py-1"
                          >
                            <span className="font-semibold text-foreground truncate">
                              {change.field}
                            </span>
                            <span className="text-red-600 truncate">
                              {change.oldValue === null ||
                              change.oldValue === undefined ? (
                                <em className="not-italic text-muted-foreground">
                                  —
                                </em>
                              ) : (
                                String(change.oldValue)
                              )}
                            </span>
                            <span className="text-green-600 truncate">
                              {change.newValue === null ||
                              change.newValue === undefined ? (
                                <em className="not-italic text-muted-foreground">
                                  —
                                </em>
                              ) : (
                                String(change.newValue)
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex items-center gap-4 mt-4 text-sm">
              <span className="text-muted-foreground">
                {t('Showing')} {skip + 1}–{Math.min(skip + PAGE_SIZE, total)}{' '}
                {t('of')} {total}
              </span>
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={skip === 0}
                  onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
                >
                  {t('Previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={skip + PAGE_SIZE >= total}
                  onClick={() => setSkip(skip + PAGE_SIZE)}
                >
                  {t('Next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Page>
  );
}

export default withAuthentication(UserLogs);
