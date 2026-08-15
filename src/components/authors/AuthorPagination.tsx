import { Button } from '../ui/Primitives';

interface AuthorPaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  disabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function AuthorPagination({
  page,
  totalPages,
  totalElements,
  disabled,
  onPrevious,
  onNext,
}: AuthorPaginationProps) {
  const displayPage = totalPages === 0 ? 0 : page + 1;
  const isFirst = page <= 0;
  const isLast = totalPages === 0 || page >= totalPages - 1;

  return (
    <div className="book-pagination">
      <p>
        Page {displayPage} of {Math.max(totalPages, 0)} · {totalElements} authors
      </p>
      <div className="book-pagination__actions">
        <Button type="button" variant="secondary" disabled={disabled || isFirst} onClick={onPrevious}>
          Previous
        </Button>
        <Button type="button" variant="secondary" disabled={disabled || isLast} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
