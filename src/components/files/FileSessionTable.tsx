import type { FileMetadataDto } from '../../types/api';
import { formatFileDate, formatFileSize } from './fileUtils';

interface FileSessionTableProps {
  files: FileMetadataDto[];
  downloadingId: number | null;
  downloadError: string | null;
  onDownload: (file: FileMetadataDto) => void;
}

export function FileSessionTable({ files, downloadingId, downloadError, onDownload }: FileSessionTableProps) {
  return (
    <div>
      {downloadError ? (
        <p className="file-alert" role="alert">
          {downloadError}
        </p>
      ) : null}
      <div className="file-table-wrap">
        <table className="file-table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Type</th>
              <th>Size</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id}>
                <td>{file.originalFilename}</td>
                <td>{file.contentType}</td>
                <td>{formatFileSize(file.size)}</td>
                <td>{formatFileDate(file.createdAt)}</td>
                <td>
                  <button
                    type="button"
                    className="file-table__action"
                    disabled={downloadingId != null}
                    aria-label={`Download ${file.originalFilename}`}
                    onClick={() => onDownload(file)}
                  >
                    {downloadingId === file.id ? 'Downloading…' : 'Download'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
