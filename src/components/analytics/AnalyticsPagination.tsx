import { Button } from '../ui/Primitives';

interface AnalyticsPaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  disabled: boolean;
  label: string;
  onPrevious: () => void;
  onNext: () => void;
}

export function AnalyticsPagination({
  page,
  totalPages,
  totalElements,
  disabled,
  label,
  onPrevious,
  onNext,
}: AnalyticsPaginationProps) {
  const displayPage = totalPages === 0 ? 0 : page + 1;
  const isFirst = page <= 0;
  const isLast = totalPages === 0 || page >= totalPages - 1;

  return (
    <div className="analytics-pagination" aria-label={label}>
      <p>
        Page {displayPage} of {Math.max(totalPages, 0)} · {totalElements} results
      </p>
      <div className="analytics-pagination__actions">
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
