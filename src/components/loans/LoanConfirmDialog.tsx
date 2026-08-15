import { useEffect, useId, type ReactNode } from 'react';
import { Button } from '../ui/Primitives';

interface LoanConfirmDialogProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LoanConfirmDialog({
  title,
  children,
  confirmLabel,
  submitting,
  onConfirm,
  onCancel,
}: LoanConfirmDialogProps) {
  const headingId = useId();

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
    <div className="loan-dialog-root">
      <button
        type="button"
        className="loan-dialog__backdrop"
        aria-label="Close dialog"
        disabled={submitting}
        onClick={() => {
          if (!submitting) {
            onCancel();
          }
        }}
      />
      <div className="loan-dialog" role="dialog" aria-modal="true" aria-labelledby={headingId}>
        <h2 id={headingId}>{title}</h2>
        <div className="loan-dialog__body">
          {children}
          <div className="loan-form__actions">
            <Button type="button" autoFocus disabled={submitting} onClick={onConfirm}>
              {submitting ? 'Returning…' : confirmLabel}
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
