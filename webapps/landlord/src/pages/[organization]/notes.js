import React, { useEffect, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';

import Page from '../../components/Page';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';

import { getNotes } from '../../utils/fetch';

export default function NotesPage() {
  const { t } = useTranslation('common');
  const router = useRouter();

  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState(null);

  async function refresh(searchText = '') {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotes({
        q: searchText?.trim() ? searchText.trim() : undefined
      });
      setNotes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || t('Something went wrong'));
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goToContext(note) {
    // For now, only properties are wired. We’ll expand later.
    if (note.entityType === 'property') {
      router.push(`/${router.query.organization}/properties/${note.entityId}`);
    }
  }

  return (
    <Page title={t('Notes')}>
      <Card className="p-6 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder={t('Search')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') refresh(q);
            }}
          />
          <Button variant="secondary" onClick={() => refresh(q)}>
            {t('Search')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setQ('');
              refresh('');
            }}
          >
            {t('Clear')}
          </Button>
        </div>

        {error ? <div className="text-sm text-red-500">{error}</div> : null}
        <Separator />

        {loading ? (
          <div className="text-sm text-muted-foreground">{t('Loading')}…</div>
        ) : notes.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t('No notes yet')}
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((n) => (
              <div key={n._id} className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  {n.authorName ? `${n.authorName} • ` : ''}
                  {n.createdDate
                    ? new Date(n.createdDate).toLocaleString()
                    : ''}
                </div>

                <div className="whitespace-pre-wrap text-sm">{n.content}</div>

                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>
                    {t('Context')}: {n.entityType} / {n.entityId}
                  </span>

                  {n.entityType === 'property' ? (
                    <Button
                      variant="link"
                      className="h-auto p-0"
                      onClick={() => goToContext(n)}
                    >
                      {t('Open')}
                    </Button>
                  ) : null}
                </div>

                <Separator />
              </div>
            ))}
          </div>
        )}
      </Card>
    </Page>
  );
}
