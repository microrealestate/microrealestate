import { useCallback, useContext, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetcher } from '../../../utils/fetch';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';
import { LuDatabase, LuRotateCcw, LuTrash2 } from 'react-icons/lu';

const QK_DB_BACKUPS = 'db-backups';

async function apiFetch(store, method, path, body) {
  const orgId = store.organization.selected?._id;
  const config = { headers: { organizationid: orgId } };
  const f = apiFetcher();
  if (method === 'GET') return f.get(path, config);
  if (method === 'POST') return f.post(path, body || {}, config);
  if (method === 'DELETE') return f.delete(path, config);
}

function DbBackup() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const queryClient = useQueryClient();
  const [confirmRestore, setConfirmRestore] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const backupsQuery = useQuery({
    queryKey: [QK_DB_BACKUPS],
    queryFn: () =>
      apiFetch(store, 'GET', '/api/v2/db-backups').then((r) => r.data),
    onError: () => toast.error(t('Error fetching backups'))
  });

  const createMutation = useMutation({
    mutationFn: () => apiFetch(store, 'POST', '/api/v2/db-backups'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK_DB_BACKUPS] });
      toast.success(t('Backup created successfully'));
    },
    onError: () => toast.error(t('Error creating backup'))
  });

  const restoreMutation = useMutation({
    mutationFn: (name) =>
      apiFetch(
        store,
        'POST',
        `/api/v2/db-backups/${encodeURIComponent(name)}/restore`
      ),
    onSuccess: () => {
      toast.success(
        t('Database restored successfully. You may need to reload the app.')
      );
    },
    onError: () => toast.error(t('Error restoring backup'))
  });

  const deleteMutation = useMutation({
    mutationFn: (name) =>
      apiFetch(
        store,
        'DELETE',
        `/api/v2/db-backups/${encodeURIComponent(name)}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK_DB_BACKUPS] });
      toast.success(t('Backup deleted'));
    },
    onError: () => toast.error(t('Error deleting backup'))
  });

  const handleCreateBackup = useCallback(() => {
    createMutation.mutate();
  }, [createMutation]);

  const handleRestoreConfirm = useCallback(() => {
    if (confirmRestore) restoreMutation.mutate(confirmRestore);
    setConfirmRestore(null);
  }, [confirmRestore, restoreMutation]);

  const handleDeleteConfirm = useCallback(() => {
    if (confirmDelete) deleteMutation.mutate(confirmDelete);
    setConfirmDelete(null);
  }, [confirmDelete, deleteMutation]);

  const backups = backupsQuery.data || [];

  return (
    <Page dataCy="dbBackupPage">
      <Card>
        <CardHeader>
          <CardTitle>{t('Database Backup & Restore')}</CardTitle>
          <CardDescription>
            {t(
              'Create point-in-time snapshots of your MongoDB database. Restoring will replace ALL current data with the selected backup.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Button
              onClick={handleCreateBackup}
              disabled={createMutation.isPending}
              className="flex items-center gap-2"
            >
              <LuDatabase className="h-4 w-4" />
              {createMutation.isPending
                ? t('Creating backup…')
                : t('Create Backup Now')}
            </Button>
          </div>

          {backupsQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">
              {t('Loading backups…')}
            </p>
          ) : backups.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t('No backups found. Create your first backup above.')}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {t('Available Backups')} ({backups.length})
              </p>
              {backups.map((backup) => (
                <div
                  key={backup.name}
                  className="flex items-center justify-between rounded border p-3 gap-4"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-mono text-sm truncate">
                      {backup.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {backup.createdAt
                        ? new Date(backup.createdAt).toLocaleString()
                        : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-amber-600 border-amber-300 hover:bg-amber-50"
                      onClick={() => setConfirmRestore(backup.name)}
                      disabled={restoreMutation.isPending}
                    >
                      <LuRotateCcw className="h-3.5 w-3.5" />
                      {t('Restore')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setConfirmDelete(backup.name)}
                      disabled={deleteMutation.isPending}
                    >
                      <LuTrash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore confirmation dialog */}
      {/* Restore confirmation dialog */}
      <Dialog
        open={!!confirmRestore}
        onOpenChange={(open) => !open && setConfirmRestore(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Restore Database?')}</DialogTitle>
            <DialogDescription>
              {t(
                'This will REPLACE your entire database with the selected backup. All changes made after this backup was created will be permanently lost. This cannot be undone.'
              )}
              <br />
              <strong className="text-foreground mt-2 block">
                {confirmRestore}
              </strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRestore(null)}>
              {t('Cancel')}
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleRestoreConfirm}
            >
              {t('Yes, Restore')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Delete Backup?')}</DialogTitle>
            <DialogDescription>
              {t(
                'This will permanently delete the backup snapshot. This cannot be undone.'
              )}
              <br />
              <strong className="text-foreground mt-2 block">
                {confirmDelete}
              </strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              {t('Cancel')}
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteConfirm}
            >
              {t('Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}

export default withAuthentication(DbBackup);
