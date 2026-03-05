import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import useTranslation from 'next-translate/useTranslation';

import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';

import { createNote, getNotes } from '../utils/fetch';

export default function NotesPanel({ entityType, entityId }) {
  const { t } = useTranslation('common');

  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [q, setQ] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);

  const canSubmit = useMemo(() => content.trim().length > 0, [content]);

  async function refresh(searchText = '') {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotes({
        entityType,
        entityId,
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

  async function uploadFile(noteId, file) {
    const form = new FormData();
    form.append('file', file);

    const response = await fetch(`/notes/${noteId}/attachments`, {
      method: 'POST',
      body: form
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Upload failed');
    }

    return await response.json();
  }

  useEffect(() => {
    if (!entityType || !entityId) return;
    refresh('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  async function onAdd() {
    setError(null);
    try {
      await createNote({
        entityType,
        entityId,
        content: content.trim()
      });
      setContent('');
      await refresh('');
    } catch (e) {
      setError(e?.message || t('Something went wrong'));
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-col gap-2">
        <div className="text-lg font-semibold">{t('Notes')}</div>

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

        <div className="flex flex-col gap-2">
          <Textarea
            placeholder={t('Add a note')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={onAdd} disabled={!canSubmit}>
              {t('Add')}
            </Button>
          </div>
        </div>

        {error ? <div className="text-sm text-red-500">{error}</div> : null}
      </div>

      <Separator />

      {loading ? (
        <div className="text-sm text-muted-foreground">{t('Loading')}…</div>
      ) : notes.length === 0 ? (
        <div className="text-sm text-muted-foreground">{t('No notes yet')}</div>
      ) : (
        <div className="space-y-4">
          {notes.map((n) => (
            <div key={n._id} className="space-y-2">
              <div className="whitespace-pre-wrap text-sm">{n.content}</div>

              <div className="text-xs text-muted-foreground">
                {n.authorName ? `${n.authorName} • ` : ''}
                {n.createdDate ? new Date(n.createdDate).toLocaleString() : ''}
              </div>

              {/* Attachments */}
              {Array.isArray(n.attachments) && n.attachments.length > 0 ? (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {t('Attachments') || 'Attachments'}
                  </div>

                  {n.attachments.map((a) => (
                    <div key={a._id} className="text-sm">
                      <a
                        className="underline"
                        href={`/api/v2/notes/${n._id}/attachments/${a._id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {a.originalName || 'file'}
                      </a>
                      <span className="text-xs text-muted-foreground">
                        {' '}
                        ({Math.round(((a.sizeBytes || 0) / 1024) * 10) / 10} KB)
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Upload */}
              <div className="pt-1">
                <input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setError(null);
                    try {
                      await uploadFile(n._id, file);
                      await refresh(q);
                    } catch (err) {
                      setError(err?.message || 'Upload failed');
                    } finally {
                      // allow selecting the same file twice
                      e.target.value = '';
                    }
                  }}
                />
              </div>

              <Separator />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

NotesPanel.propTypes = {
  entityType: PropTypes.oneOf(['property', 'contact', 'contract', 'project'])
    .isRequired,
  entityId: PropTypes.string.isRequired
};
