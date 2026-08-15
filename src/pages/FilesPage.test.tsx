import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import App from '../App';
import type { FileMetadataDto } from '../types/api';
import { FilesPage } from './FilesPage';

const {
  getCurrentRole,
  hasValidAccessSession,
  getCurrentEmail,
  getAccessTokenExpiresAt,
  uploadFile,
  downloadFile,
  saveBlobDownload,
} = vi.hoisted(() => ({
  getCurrentRole: vi.fn(),
  hasValidAccessSession: vi.fn(),
  getCurrentEmail: vi.fn(),
  getAccessTokenExpiresAt: vi.fn(),
  uploadFile: vi.fn(),
  downloadFile: vi.fn(),
  saveBlobDownload: vi.fn(),
}));

vi.mock('../auth/session', () => ({
  getCurrentRole,
  hasValidAccessSession,
  getCurrentEmail,
  getAccessTokenExpiresAt,
  clearSession: vi.fn(),
}));

vi.mock('../api/files', () => ({
  uploadFile,
  downloadFile,
}));

vi.mock('../components/files/fileUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../components/files/fileUtils')>();
  return {
    ...actual,
    saveBlobDownload,
  };
});

vi.mock('../api/books', () => ({
  listBooks: vi.fn().mockResolvedValue({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: true,
    numberOfElements: 0,
    pageable: {
      pageNumber: 0,
      pageSize: 20,
      offset: 0,
      paged: true,
      unpaged: false,
      sort: { empty: true, sorted: false, unsorted: true },
    },
    sort: { empty: true, sorted: false, unsorted: true },
  }),
  searchBooks: vi.fn(),
  createBook: vi.fn(),
  updateBook: vi.fn(),
  deleteBook: vi.fn(),
}));

vi.mock('../api/authors', () => ({
  listAuthors: vi.fn().mockResolvedValue({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: true,
    numberOfElements: 0,
    pageable: {
      pageNumber: 0,
      pageSize: 20,
      offset: 0,
      paged: true,
      unpaged: false,
      sort: { empty: true, sorted: false, unsorted: true },
    },
    sort: { empty: true, sorted: false, unsorted: true },
  }),
  createAuthor: vi.fn(),
  updateAuthor: vi.fn(),
  deleteAuthor: vi.fn(),
  getAuthor: vi.fn(),
}));

vi.mock('../api/members', () => ({
  listMembers: vi.fn(),
  createMember: vi.fn(),
  updateMember: vi.fn(),
  deleteMember: vi.fn(),
  getMember: vi.fn(),
  borrowBook: vi.fn(),
}));

const metadata: FileMetadataDto = {
  id: 12,
  originalFilename: 'receipt.pdf',
  contentType: 'application/pdf',
  size: 2048,
  createdAt: '2026-08-15T12:00:00Z',
};

function pngFile(name = 'photo.png'): File {
  return new File([new Uint8Array([1, 2, 3, 4])], name, { type: 'image/png' });
}

function renderFilesPage() {
  return render(
    <MemoryRouter initialEntries={['/files']}>
      <FilesPage />
    </MemoryRouter>,
  );
}

function renderAppAtFiles() {
  return render(
    <MemoryRouter initialEntries={['/files']}>
      <App />
    </MemoryRouter>,
  );
}

describe('FilesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentRole.mockReturnValue('USER');
    hasValidAccessSession.mockReturnValue(true);
    getCurrentEmail.mockReturnValue('user@library.com');
    getAccessTokenExpiresAt.mockReturnValue(null);
    uploadFile.mockResolvedValue(metadata);
    downloadFile.mockResolvedValue(new Blob(['pdf-bytes'], { type: 'application/pdf' }));
    saveBlobDownload.mockResolvedValue(undefined);
  });

  it('lets a USER access /files', async () => {
    renderAppAtFiles();
    expect(await screen.findByRole('heading', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
  });

  it('lets an ADMIN access /files', async () => {
    getCurrentRole.mockReturnValue('ADMIN');
    getCurrentEmail.mockReturnValue('admin@library.com');
    renderAppAtFiles();
    expect(await screen.findByRole('heading', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
  });

  it('uploads a file, displays returned metadata, and downloads with downloadFile', async () => {
    const user = userEvent.setup();
    renderFilesPage();

    const input = screen.getByLabelText('Choose file');
    await user.upload(input, pngFile());
    expect(screen.getByText(/photo.png/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Upload' }));

    await waitFor(() => {
      expect(uploadFile).toHaveBeenCalledTimes(1);
    });
    const uploaded = uploadFile.mock.calls[0][0] as File;
    expect(uploaded.name).toBe('photo.png');
    expect(await screen.findByText('File uploaded successfully.')).toBeInTheDocument();
    expect(screen.getByText('receipt.pdf')).toBeInTheDocument();
    expect(screen.getByText('application/pdf')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Download receipt.pdf' }));
    await waitFor(() => {
      expect(downloadFile).toHaveBeenCalledWith(12);
    });
    expect(saveBlobDownload).toHaveBeenCalled();
  });

  it('validates missing, unsupported, and oversized files', async () => {
    const user = userEvent.setup();
    renderFilesPage();

    await user.click(screen.getByRole('button', { name: 'Upload' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Select a file to upload.');
    expect(uploadFile).not.toHaveBeenCalled();

    const input = screen.getByLabelText('Choose file');
    fireEvent.change(input, { target: { files: [new File(['hello'], 'notes.txt', { type: 'text/plain' })] } });
    await user.click(screen.getByRole('button', { name: 'Upload' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Only JPEG, PNG, and PDF files are supported.');
    expect(uploadFile).not.toHaveBeenCalled();

    const large = new File(['x'], 'huge.png', { type: 'image/png' });
    Object.defineProperty(large, 'size', { value: 10 * 1024 * 1024 + 1 });
    fireEvent.change(input, { target: { files: [large] } });
    await user.click(screen.getByRole('button', { name: 'Upload' }));
    expect(screen.getByRole('alert')).toHaveTextContent('File must be 10 MiB or smaller.');
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it('shows upload ApiError.message', async () => {
    uploadFile.mockRejectedValue(
      new ApiError({
        timestamp: '2026-08-15T00:00:00Z',
        status: 400,
        error: 'Bad Request',
        message: 'File exceeds maximum size',
        fieldErrors: null,
      }),
    );
    const user = userEvent.setup();
    renderFilesPage();

    await user.upload(screen.getByLabelText('Choose file'), pngFile());
    await user.click(screen.getByRole('button', { name: 'Upload' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('File exceeds maximum size');
  });

  it('shows download ApiError.message', async () => {
    downloadFile.mockRejectedValue(
      new ApiError({
        timestamp: '2026-08-15T00:00:00Z',
        status: 404,
        error: 'Not Found',
        message: 'File not found',
        fieldErrors: null,
      }),
    );
    const user = userEvent.setup();
    renderFilesPage();

    await user.upload(screen.getByLabelText('Choose file'), pngFile());
    await user.click(screen.getByRole('button', { name: 'Upload' }));
    await screen.findByText('receipt.pdf');
    await user.click(screen.getByRole('button', { name: 'Download receipt.pdf' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('File not found');
  });
});
