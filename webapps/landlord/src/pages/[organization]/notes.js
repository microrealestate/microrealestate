import {
  createNote,
  getDocumentBlobUrl,
  getNotes,
  openDocumentInNewTab,
  removeNote,
  updateNote,
  uploadDocument
} from '../../utils/fetch';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import Page from '../../components/Page';
import { Separator } from '../../components/ui/separator';
import { Textarea } from '../../components/ui/textarea';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

export default function NotesPage() {
  const { t } = useTranslation('common');
  const router = useRouter();

  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState(null);

  // New note creation
  const [content, setContent] = useState('');
  const [newFiles, setNewFiles] = useState([]);
  const [adding, setAdding] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0
  });

  // Editing
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [savingNoteId, setSavingNoteId] = useState(null);
  const [deletingNoteId, setDeletingNoteId] = useState(null);

  // Attachments
  const [uploadingNoteId, setUploadingNoteId] = useState(null);
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
    refresh('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function getFileIdentity(file) {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  function appendPendingFiles(selectedFiles) {
    if (!selectedFiles?.length) return;

    setNewFiles((prev) => {
      const existingIds = new Set(prev.map((file) => getFileIdentity(file)));
      const next = [...prev];

      selectedFiles.forEach((file) => {
        const id = getFileIdentity(file);
        if (!existingIds.has(id)) {
          next.push(file);
          existingIds.add(id);
        }
      });

      return next;
    });
  }

  function removePendingFile(indexToRemove) {
    setNewFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
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
      const created = await createNote({
        content: content.trim()
      });

      const createdId = created?._id;

      setContent('');

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

  function goToContext(note) {
    switch (note.entityType) {
      case 'property':
        router.push(
          `/${router.query.organization}/properties/${note.entityId}`
        );
        break;
      case 'contact':
        router.push(`/${router.query.organization}/tenants/${note.entityId}`);
        break;
      default:
        break;
    }
  }

  return (
    <Page title={t('Notes')}>
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
              <input
                ref={newFileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  appendPendingFiles(Array.from(e.target.files || []));
                  e.target.value = '';
                }}
              />
              <Button
                type="button"
                variant="secondary"
                className="rounded-full"
                onClick={() => newFileInputRef.current?.click()}
              >
                {t('Add file') || 'Add file'}
              </Button>
              {newFiles.length > 0 ? (
                <div className="text-xs text-muted-foreground">
                  {newFiles.length}{' '}
                  {newFiles.length === 1 ? t('file') : t('files')} selected
                </div>
              ) : null}
            </div>

            {newFiles.length > 0 ? (
              <div className="space-y-1">
                {newFiles.map((file, index) => (
                  <div
                    key={getFileIdentity(file)}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span className="truncate max-w-[360px] text-muted-foreground">
                      {file.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-6 px-2 rounded-full"
                      onClick={() => removePendingFile(index)}
                    >
                      {t('Remove') || 'Remove'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button
                onClick={onAdd}
                disabled={!canSubmit || adding}
                className="rounded-full"
              >
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
          <div className="text-sm text-muted-foreground">
            {t('No notes yet')}
          </div>
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
                        className="rounded-full"
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
                  {n.createdDate
                    ? new Date(n.createdDate).toLocaleString()
                    : ''}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => startEdit(n)}
                    disabled={
                      deletingNoteId === n._id || savingNoteId === n._id
                    }
                  >
                    {t('Edit') || 'Edit'}
                  </Button>
                  <Button
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => onDelete(n._id)}
                    disabled={
                      deletingNoteId === n._id || savingNoteId === n._id
                    }
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
                      <div
                        key={a._id}
                        className="text-sm flex items-start gap-3"
                      >
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
                              className="group relative shrink-0 border rounded-md bg-background"
                              onClick={async () => {
                                try {
                                  await openDocumentInNewTab({
                                    endpoint: `/notes/${n._id}/attachments/${a._id}`
                                  });
                                } catch (err) {
                                  setError(
                                    err?.message || 'Failed to open file'
                                  );
                                }
                              }}
                            >
                              <img
                                src={previewUrls[attachmentKey(n._id, a._id)]}
                                alt={a.originalName || 'attachment preview'}
                                className="w-40 h-28 rounded-md object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                              <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 group-hover:block">
                                <img
                                  src={previewUrls[attachmentKey(n._id, a._id)]}
                                  alt={
                                    a.originalName ||
                                    'attachment preview enlarged'
                                  }
                                  className="w-72 h-52 rounded-md border object-cover bg-background"
                                />
                              </div>
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

                {/* Context info */}
                {n.entityType ? (
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>
                      {t('Context')}: {n.entityLabel || n.entityType}{' '}
                      {n.entityLabel ? '' : `/ ${n.entityId}`}
                    </span>

                    {['property', 'contact'].includes(n.entityType) ? (
                      <Button
                        variant="link"
                        className="h-auto p-0"
                        onClick={() => goToContext(n)}
                      >
                        {t('Open')}
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                <Separator />
              </div>
            ))}
          </div>
        )}
      </Card>
    </Page>
  );
}
