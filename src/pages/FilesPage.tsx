import { useState } from 'react';
import { downloadFile, uploadFile } from '../api/files';
import { errorMessage } from '../components/auth/formErrors';
import { FileSessionTable } from '../components/files/FileSessionTable';
import { FileUploadCard } from '../components/files/FileUploadCard';
import { saveBlobDownload } from '../components/files/fileUtils';
import '../components/files/files.css';
import { Card, EmptyState, PageHeader } from '../components/ui/Primitives';
import type { FileMetadataDto } from '../types/api';

export function FilesPage() {
  const [uploaded, setUploaded] = useState<FileMetadataDto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const metadata = await uploadFile(file);
      setUploaded((current) => [metadata, ...current]);
      setUploadSuccess('File uploaded successfully.');
    } catch (error) {
      setUploadError(errorMessage(error, 'Unable to upload the file.'));
      throw error;
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(file: FileMetadataDto) {
    if (downloadingId != null) {
      return;
    }
    setDownloadingId(file.id);
    setDownloadError(null);
    try {
      const blob = await downloadFile(file.id);
      await saveBlobDownload(blob, file.originalFilename);
    } catch (error) {
      setDownloadError(errorMessage(error, 'Unable to download the file.'));
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="file-page">
      <div className="file-page__toolbar">
        <PageHeader
          title="Files"
          description="Upload a JPEG, PNG, or PDF and download it from this session. The API does not list previously stored files."
        />
      </div>

      <Card>
        <h2 className="file-card__title">Upload</h2>
        <FileUploadCard
          uploading={uploading}
          error={uploadError}
          success={uploadSuccess}
          onUpload={handleUpload}
        />
      </Card>

      <Card>
        <h2 className="file-card__title">Uploaded this session</h2>
        {uploaded.length === 0 ? (
          <EmptyState
            title="No files in this session."
            body="Successfully uploaded files appear here until you refresh the page. There is no server file catalogue."
          />
        ) : (
          <FileSessionTable
            files={uploaded}
            downloadingId={downloadingId}
            downloadError={downloadError}
            onDownload={(file) => {
              void handleDownload(file);
            }}
          />
        )}
      </Card>
    </div>
  );
}
