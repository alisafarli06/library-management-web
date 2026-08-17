import { useEffect, useState } from 'react';
import { downloadFile } from '../../api/files';
import { errorMessage } from '../auth/formErrors';
import { saveBlobDownload } from '../files/fileUtils';
import { Badge, Button } from '../ui/Primitives';
import type { BookDto } from '../../types/api';

interface BookDetailsDialogProps {
  book: BookDto;
  canManage: boolean;
  submitting: boolean;
  onBorrow: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function BookDetailsDialog({
  book,
  canManage,
  submitting,
  onBorrow,
  onEdit,
  onDelete,
  onClose,
}: BookDetailsDialogProps) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<'cover' | 'preface' | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting && downloading == null) {
        onClose();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [downloading, onClose, submitting]);

  useEffect(() => {
    if (book.coverFileId == null) {
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    void downloadFile(book.coverFileId)
      .then((blob) => {
        if (cancelled) {
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setCoverPreviewUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setCoverPreviewUrl(null);
        }
      });
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [book.coverFileId]);

  async function handleDownload(kind: 'cover' | 'preface') {
    const fileId = kind === 'cover' ? book.coverFileId : book.prefaceFileId;
    const filename = kind === 'cover' ? book.coverFileName : book.prefaceFileName;
    if (fileId == null || downloading != null) {
      return;
    }
    setDownloading(kind);
    setDownloadError(null);
    try {
      const blob = await downloadFile(fileId);
      await saveBlobDownload(blob, filename || (kind === 'cover' ? 'cover' : 'preface.pdf'));
    } catch (error) {
      setDownloadError(errorMessage(error, 'Unable to download the file.'));
    } finally {
      setDownloading(null);
    }
  }

  const available = book.available === true;
  const busy = submitting || downloading != null;

  return (
    <div className="book-dialog-root">
      <button
        type="button"
        className="book-dialog__backdrop"
        aria-label="Close dialog"
        disabled={busy}
        onClick={() => {
          if (!busy) {
            onClose();
          }
        }}
      />
      <div className="book-dialog" role="dialog" aria-modal="true" aria-labelledby="book-details-heading">
        <p className="book-details__kicker">Title</p>
        <h2 id="book-details-heading">{book.title}</h2>
        <dl className="book-details">
          <div>
            <dt>Author</dt>
            <dd>{book.authorName ?? '—'}</dd>
          </div>
          <div>
            <dt>ISBN</dt>
            <dd>{book.isbn}</dd>
          </div>
          <div>
            <dt>Published year</dt>
            <dd>{book.publishedYear ?? '—'}</dd>
          </div>
          <div>
            <dt>Availability</dt>
            <dd>
              <Badge tone={available ? 'success' : 'warning'}>
                {available ? 'Available' : 'Currently borrowed'}
              </Badge>
            </dd>
          </div>
        </dl>

        {coverPreviewUrl ? (
          <img className="book-cover-preview" src={coverPreviewUrl} alt={`Cover of ${book.title}`} />
        ) : null}

        <section className="book-details__materials" aria-labelledby="book-materials-heading">
          <h3 id="book-materials-heading">Materials</h3>
          <dl className="book-details">
            <div>
              <dt>Cover</dt>
              <dd>{book.coverFileId != null ? book.coverFileName || 'Attached' : 'Not attached'}</dd>
            </div>
            <div>
              <dt>Preface</dt>
              <dd>{book.prefaceFileId != null ? book.prefaceFileName || 'Attached' : 'Not attached'}</dd>
            </div>
          </dl>
        </section>

        {downloadError ? (
          <p className="book-alert" role="alert">
            {downloadError}
          </p>
        ) : null}

        <div className="book-form__actions">
          {book.coverFileId != null ? (
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void handleDownload('cover')}>
              {downloading === 'cover' ? 'Downloading…' : 'Download Cover'}
            </Button>
          ) : null}
          {book.prefaceFileId != null ? (
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void handleDownload('preface')}>
              {downloading === 'preface' ? 'Downloading…' : 'Download Preface'}
            </Button>
          ) : null}
          <Button type="button" disabled={busy || !available} onClick={onBorrow}>
            Borrow
          </Button>
          {canManage ? (
            <>
              <Button type="button" variant="secondary" disabled={busy} onClick={onEdit}>
                Edit
              </Button>
              <Button type="button" variant="secondary" disabled={busy} onClick={onDelete}>
                Delete
              </Button>
            </>
          ) : null}
          <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
