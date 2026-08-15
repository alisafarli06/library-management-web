import { useEffect, type ReactNode } from 'react';
import { Button } from '../ui/Primitives';

interface BookConfirmDialogProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BookConfirmDialog({
  title,
  children,
  confirmLabel,
  submitting,
  onConfirm,
  onCancel,
}: BookConfirmDialogProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) {
        onCancel();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel, submitting]);

  return (
    <div className="book-dialog-root">
      <button
        type="button"
        className="book-dialog__backdrop"
        aria-label="Close dialog"
        disabled={submitting}
        onClick={() => {
          if (!submitting) {
            onCancel();
          }
        }}
      />
      <div className="book-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-heading">
        <h2 id="confirm-heading">{title}</h2>
        <div className="book-form">
          {children}
          <div className="book-form__actions">
            <Button type="button" disabled={submitting} onClick={onConfirm}>
              {submitting ? 'Working…' : confirmLabel}
            </Button>
            <Button type="button" variant="secondary" disabled={submitting} onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
