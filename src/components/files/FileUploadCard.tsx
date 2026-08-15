import { useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '../ui/Primitives';
import { formatFileSize, validateSelectedFile } from './fileUtils';

interface FileUploadCardProps {
  uploading: boolean;
  error: string | null;
  success: string | null;
  onUpload: (file: File) => Promise<void>;
}

export function FileUploadCard({ uploading, error, success, onUpload }: FileUploadCardProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelected(file);
    setValidationError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading) {
      return;
    }

    const nextError = validateSelectedFile(selected);
    if (nextError || !selected) {
      setValidationError(nextError ?? 'Select a file to upload.');
      return;
    }

    setValidationError(null);
    try {
      await onUpload(selected);
      setSelected(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch {
      // Parent displays ApiError.message.
    }
  }

  const displayError = validationError ?? error;

  return (
    <form className="file-upload" onSubmit={(event) => void handleSubmit(event)}>
      <label className="file-upload__field" htmlFor={inputId}>
        Choose file
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"
          disabled={uploading}
          onChange={handleFileChange}
        />
      </label>

      {selected ? (
        <p className="file-meta">
          Selected: <strong>{selected.name}</strong> ({formatFileSize(selected.size)})
        </p>
      ) : (
        <p className="file-meta">JPEG, PNG, or PDF. Maximum size 10 MiB.</p>
      )}

      {displayError ? (
        <p className="file-alert" role="alert">
          {displayError}
        </p>
      ) : null}

      {success ? (
        <p className="file-success" role="status">
          {success}
        </p>
      ) : null}

      <div className="file-actions">
        <Button type="submit" disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
      </div>
    </form>
  );
}
