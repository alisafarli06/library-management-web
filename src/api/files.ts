import type { FileMetadataDto } from '../types/api';
import { getBlob, postForm } from './http';

export function uploadFile(file: File): Promise<FileMetadataDto> {
  const formData = new FormData();
  formData.append('file', file);
  return postForm<FileMetadataDto>('/files', formData);
}

export function downloadFile(id: number): Promise<Blob> {
  return getBlob(`/files/${id}`);
}
