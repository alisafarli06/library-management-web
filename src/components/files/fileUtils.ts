export const FILE_MAX_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;

const EXTENSION_TYPES: Record<string, (typeof ALLOWED_FILE_TYPES)[number]> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export function formatFileDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function resolveFileType(file: File): string {
  if (file.type) {
    return file.type;
  }
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_TYPES[extension] ?? '';
}

export function validateSelectedFile(file: File | null): string | null {
  if (!file) {
    return 'Select a file to upload.';
  }
  const type = resolveFileType(file);
  if (!ALLOWED_FILE_TYPES.includes(type as (typeof ALLOWED_FILE_TYPES)[number])) {
    return 'Only JPEG, PNG, and PDF files are supported.';
  }
  if (file.size > FILE_MAX_SIZE_BYTES) {
    return 'File must be 10 MiB or smaller.';
  }
  return null;
}

export function validateCoverFile(file: File | null): string | null {
  if (!file) {
    return null;
  }
  const type = resolveFileType(file);
  if (type !== 'image/jpeg' && type !== 'image/png') {
    return 'Cover must be a JPEG or PNG image.';
  }
  if (file.size > FILE_MAX_SIZE_BYTES) {
    return 'Cover must be 10 MiB or smaller.';
  }
  return null;
}

export function validatePrefaceFile(file: File | null): string | null {
  if (!file) {
    return null;
  }
  const type = resolveFileType(file);
  if (type !== 'application/pdf') {
    return 'Preface must be a PDF document.';
  }
  if (file.size > FILE_MAX_SIZE_BYTES) {
    return 'Preface must be 10 MiB or smaller.';
  }
  return null;
}

export async function saveBlobDownload(blob: Blob, filename: string): Promise<void> {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.rel = 'noopener';
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
