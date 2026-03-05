import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import useTranslation from 'next-translate/useTranslation';

import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';

import { createNote, getNotes, uploadDocument } from '../utils/fetch';

export default function NotesPanel({ entityType, entityId }) {
  const { t } = useTranslation('common');

  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [q, setQ] = useState('');
  const [content, setContent] = useState('');
  const [newFile, setNewFile] = useState(null);

  const [error, setError] = useState(null);
  const [uploadingNoteId, setUploadingNoteId] = useState(null);
  const [adding, setAdding] = useState(false);

  const newFileInputRef = useRef(null);

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

  async function uploadAttachment(noteId, file) {
    // IMPORTANT: this uses apiFetcher under the hood, so it includes accessToken
    return uploadDocument({
      endpoint: `/notes/${noteId}/attachments`,
      documentName: file.name,
      file
    });
  }

  useEffect(() => {
    if (!entityType || !entityId) return;
    refresh('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  async function onAdd() {
    if (!canSubmit) return;

    setAdding(true);
    setError(null);

    try {
      // createNote() (in your utils/fetch.js) returns response.data
      // which should be the created note object (including _id)
      const created = await createNote({
        entityType,
        entityId,
        content: content.trim()
      });

      const createdId = created?._id;

      // Clear text immediately so it feels responsive
      setContent('');

      // If user selected a file for the new note, upload it now
      if (newFile && createdId) {
        setUploadingNoteId(createdId);
        try {
          await uploadAttachment(createdId, newFile);
        } finally {
          setUploadingNoteId(null);
          setNewFile(null);
          if (newFileInputRef.current) newFileInputRef.current.value = '';
        }
      } else {
        // no file chosen
        setNewFile(null);
        if (newFileInputRef.current) newFileInputRef.current.value = '';
      }

      await refresh(q);
    } catch (e) {
      setError(e?.message || t('Something went wrong'));
    } finally {
      setAdding(false);
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-col gap-2">
        <div className="text-lg font-semibold">{t('Notes')}</div>

        {/* Search */}
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

        {/* Add note */}
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder={t('Add a note')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {/* Optional attachment for NEW note */}
          <div className="flex items-center gap-2">
            <Input
              ref={newFileInputRef}
              type="file"
              onChange={(e) => setNewFile(e.target.files?.[0] || null)}
            />
            {newFile ? (
              <div className="text-xs text-muted-foreground truncate max-w-[240px]">
                {newFile.name}
              </div>
            ) : null}
          </div>

          <div className="flex justify-end">
            <Button onClick={onAdd} disabled={!canSubmit || adding}>
              {adding ? `${t('Add')}…` : t('Add')}
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

              {/* Attachments list */}
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

              {/* Upload to existing note */}
              <div className="pt-1 flex items-center gap-2">
                <Input
                  type="file"
                  disabled={uploadingNoteId === n._id}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setError(null);
                    setUploadingNoteId(n._id);

                    try {
                      await uploadAttachment(n._id, file);
                      await refresh(q);
                    } catch (err) {
                      setError(err?.message || 'Upload failed');
                    } finally {
                      setUploadingNoteId(null);
                      // allow selecting the same file twice
                      e.target.value = '';
                    }
                  }}
                />
                {uploadingNoteId === n._id ? (
                  <div className="text-xs text-muted-foreground">
                    {t('Uploading') || 'Uploading'}…
                  </div>
                ) : null}
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
