import {
  createNote,
  getDocumentBlobUrl,
  getNotes,
  openDocumentInNewTab,
  removeNote,
  updateNote,
  uploadDocument
} from '../utils/fetch';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import useTranslation from 'next-translate/useTranslation';
import PropTypes from 'prop-types';

export default function NotesPanel({ entityType, entityId }) {
  const { t } = useTranslation('common');

  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [q, setQ] = useState('');
  const [content, setContent] = useState('');
  const [newFiles, setNewFiles] = useState([]);

  const [error, setError] = useState(null);
  const [uploadingNoteId, setUploadingNoteId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0
  });
  const [adding, setAdding] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [savingNoteId, setSavingNoteId] = useState(null);
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [previewUrls, setPreviewUrls] = useState({});
  const [previewLoading, setPreviewLoading] = useState({});

  const newFileInputRef = useRef(null);
  const previewUrlsRef = useRef({});

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

  async function uploadMultipleAttachments(noteId, files) {
    const results = [];
    setUploadProgress({ current: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length });

      try {
        const result = await uploadAttachment(noteId, file);
        results.push({ file: file.name, success: true, result });
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
        results.push({
          file: file.name,
          success: false,
          error: err?.message || String(err)
        });
      }
    }

    setUploadProgress({ current: 0, total: 0 });

    // Check if any failed
    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      const failedNames = failed.map((f) => f.file).join(', ');
      throw new Error(
        `Failed to upload ${failed.length} file(s): ${failedNames}`
      );
    }

    return results;
  }

  useEffect(() => {
    if (!entityType || !entityId) return;
    refresh('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(
    () => () => {
      Object.values(previewUrlsRef.current).forEach((url) => {
        if (url) window.URL.revokeObjectURL(url);
      });
    },
    []
  );

  function attachmentKey(noteId, attachmentId) {
    return `${noteId}:${attachmentId}`;
  }

  function isImageAttachment(attachment) {
    return String(attachment?.mimeType || '').startsWith('image/');
  }

  async function ensureAttachmentPreview(noteId, attachmentId) {
    const key = attachmentKey(noteId, attachmentId);
    if (previewUrlsRef.current[key]) return previewUrlsRef.current[key];

    setPreviewLoading((prev) => ({ ...prev, [key]: true }));

    const url = await getDocumentBlobUrl({
      endpoint: `/notes/${noteId}/attachments/${attachmentId}`
    });

    setPreviewUrls((prev) => {
      if (prev[key]) {
        window.URL.revokeObjectURL(url);
        return prev;
      }
      return { ...prev, [key]: url };
    });

    setPreviewLoading((prev) => ({ ...prev, [key]: false }));

    return url;
  }

  useEffect(() => {
    let cancelled = false;

    async function loadImagePreviews() {
      for (const note of notes) {
        for (const attachment of note.attachments || []) {
          if (!isImageAttachment(attachment)) continue;
          const key = attachmentKey(note._id, attachment._id);
          if (previewUrlsRef.current[key]) continue;

          try {
            setPreviewLoading((prev) => ({ ...prev, [key]: true }));
            const url = await getDocumentBlobUrl({
              endpoint: `/notes/${note._id}/attachments/${attachment._id}`
            });

            if (cancelled) {
              window.URL.revokeObjectURL(url);
              return;
            }

            setPreviewUrls((prev) => {
              if (prev[key]) {
                window.URL.revokeObjectURL(url);
                return prev;
              }
              return { ...prev, [key]: url };
            });
          } catch {
            // ignore preview load errors
          } finally {
            if (!cancelled) {
              setPreviewLoading((prev) => ({ ...prev, [key]: false }));
            }
          }
        }
      }
    }

    loadImagePreviews();

    return () => {
      cancelled = true;
    };
  }, [notes]);

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

      // If user selected files for the new note, upload them now
      if (newFiles.length > 0 && createdId) {
        setUploadingNoteId(createdId);
        try {
          await uploadMultipleAttachments(createdId, newFiles);
        } finally {
          setUploadingNoteId(null);
          setNewFiles([]);
          if (newFileInputRef.current) newFileInputRef.current.value = '';
        }
      } else {
        // no files chosen
        setNewFiles([]);
        if (newFileInputRef.current) newFileInputRef.current.value = '';
      }

      await refresh(q);
    } catch (e) {
      setError(e?.message || t('Something went wrong'));
    } finally {
      setAdding(false);
    }
  }

  function startEdit(note) {
    setEditingNoteId(note._id);
    setEditingContent(note.content || '');
    setError(null);
  }

  function cancelEdit() {
    setEditingNoteId(null);
    setEditingContent('');
  }

  async function onSaveEdit(noteId) {
    if (!editingContent.trim()) {
      setError(t('Content is required') || 'Content is required');
      return;
    }

    setSavingNoteId(noteId);
    setError(null);

    try {
      await updateNote(noteId, { content: editingContent.trim() });
      cancelEdit();
      await refresh(q);
    } catch (err) {
      setError(err?.message || 'Failed to update note');
    } finally {
      setSavingNoteId(null);
    }
  }

  async function onDelete(noteId) {
    const confirmed = window.confirm(
      t('Are you sure you want to delete this note?') ||
        'Are you sure you want to delete this note?'
    );
    if (!confirmed) return;

    setDeletingNoteId(noteId);
    setError(null);

    try {
      await removeNote(noteId);
      if (editingNoteId === noteId) {
        cancelEdit();
      }
      await refresh(q);
    } catch (err) {
      setError(err?.message || 'Failed to delete note');
    } finally {
      setDeletingNoteId(null);
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

          {/* Optional attachments for NEW note */}
          <div className="flex items-center gap-2">
            <Input
              ref={newFileInputRef}
              type="file"
              multiple
              onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
            />
            {newFiles.length > 0 ? (
              <div className="text-xs text-muted-foreground">
                {newFiles.length}{' '}
                {newFiles.length === 1 ? t('file') : t('files')} selected
              </div>
            ) : null}
          </div>

          <div className="flex justify-end">
            <Button onClick={onAdd} disabled={!canSubmit || adding}>
              {adding
                ? uploadProgress.total > 1
                  ? `${t('Add')}… (${uploadProgress.current}/${uploadProgress.total})`
                  : `${t('Add')}…`
                : t('Add')}
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
              {editingNoteId === n._id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      disabled={savingNoteId === n._id}
                      onClick={() => onSaveEdit(n._id)}
                    >
                      {savingNoteId === n._id
                        ? t('Saving') || 'Saving…'
                        : t('Save') || 'Save'}
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={savingNoteId === n._id}
                      onClick={cancelEdit}
                    >
                      {t('Cancel') || 'Cancel'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm">{n.content}</div>
              )}

              <div className="text-xs text-muted-foreground">
                {n.authorName ? `${n.authorName} • ` : ''}
                {n.createdDate ? new Date(n.createdDate).toLocaleString() : ''}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => startEdit(n)}
                  disabled={deletingNoteId === n._id || savingNoteId === n._id}
                >
                  {t('Edit') || 'Edit'}
                </Button>
                <Button
                  variant="secondary"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => onDelete(n._id)}
                  disabled={deletingNoteId === n._id || savingNoteId === n._id}
                >
                  {deletingNoteId === n._id
                    ? t('Deleting') || 'Deleting…'
                    : t('Delete') || 'Delete'}
                </Button>
              </div>

              {/* Attachments list */}
              {Array.isArray(n.attachments) && n.attachments.length > 0 ? (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {t('Attachments') || 'Attachments'}
                  </div>

                  {n.attachments.map((a) => (
                    <div key={a._id} className="text-sm flex items-start gap-3">
                      <div className="min-w-0">
                        <a
                          className="underline cursor-pointer text-blue-600 hover:text-blue-800"
                          onClick={async (e) => {
                            e.preventDefault();
                            try {
                              await openDocumentInNewTab({
                                endpoint: `/notes/${n._id}/attachments/${a._id}`
                              });
                            } catch (err) {
                              setError(err?.message || 'Failed to open file');
                            }
                          }}
                        >
                          {a.originalName || 'file'}
                        </a>
                        <span className="text-xs text-muted-foreground">
                          {' '}
                          ({Math.round(((a.sizeBytes || 0) / 1024) * 10) /
                            10}{' '}
                          KB)
                        </span>
                        {!isImageAttachment(a) ? (
                          <div className="mt-1">
                            <Button
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={async () => {
                                try {
                                  const url = await ensureAttachmentPreview(
                                    n._id,
                                    a._id
                                  );
                                  window.open(
                                    url,
                                    '_blank',
                                    'noopener,noreferrer'
                                  );
                                } catch (err) {
                                  setError(
                                    err?.message || 'Failed to preview file'
                                  );
                                }
                              }}
                            >
                              {t('Preview') || 'Preview'}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                      {isImageAttachment(a) ? (
                        previewUrls[attachmentKey(n._id, a._id)] ? (
                          <button
                            type="button"
                            className="shrink-0 border rounded-md overflow-hidden"
                            onClick={async () => {
                              try {
                                await openDocumentInNewTab({
                                  endpoint: `/notes/${n._id}/attachments/${a._id}`
                                });
                              } catch (err) {
                                setError(err?.message || 'Failed to open file');
                              }
                            }}
                          >
                            <img
                              src={previewUrls[attachmentKey(n._id, a._id)]}
                              alt={a.originalName || 'attachment preview'}
                              className="w-40 h-28 object-cover"
                            />
                          </button>
                        ) : previewLoading[attachmentKey(n._id, a._id)] ? (
                          <div className="w-40 h-28 shrink-0 border rounded-md flex items-center justify-center text-xs text-muted-foreground">
                            {t('Loading') || 'Loading'}{' '}
                            {t('Preview') || 'preview'}…
                          </div>
                        ) : null
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Upload to existing note */}
              <div className="pt-1 flex items-center gap-2">
                <input
                  id={`note-upload-${n._id}`}
                  type="file"
                  multiple
                  className="hidden"
                  disabled={uploadingNoteId === n._id}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;

                    setError(null);
                    setUploadingNoteId(n._id);

                    try {
                      await uploadMultipleAttachments(n._id, files);
                      await refresh(q);
                    } catch (err) {
                      setError(err?.message || 'Upload failed');
                    } finally {
                      setUploadingNoteId(null);
                      e.target.value = '';
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={uploadingNoteId === n._id}
                  onClick={() => {
                    const input = document.getElementById(
                      `note-upload-${n._id}`
                    );
                    input?.click();
                  }}
                >
                  {t('Attach files') || 'Attach files'}
                </Button>
                {uploadingNoteId === n._id ? (
                  <div className="text-xs text-muted-foreground">
                    {uploadProgress.total > 1
                      ? `${t('Uploading') || 'Uploading'} ${uploadProgress.current}/${uploadProgress.total}…`
                      : `${t('Uploading') || 'Uploading'}…`}
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
