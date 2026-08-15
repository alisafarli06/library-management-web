import type { FormEvent } from 'react';
import { Button } from '../ui/Primitives';
import type { AvailableFilter, BookListQuery } from './bookListQuery';

interface BookFiltersProps {
  value: BookListQuery;
  disabled: boolean;
  onChange: (next: BookListQuery) => void;
  onSubmit: () => void;
  onClear: () => void;
}

export function BookFilters({ value, disabled, onChange, onSubmit, onClear }: BookFiltersProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="book-filters" onSubmit={handleSubmit}>
      <div className="book-filters__grid">
        <label className="book-filters__field">
          <span>Title</span>
          <input
            value={value.title}
            onChange={(event) => onChange({ ...value, title: event.target.value })}
            autoComplete="off"
          />
        </label>
        <label className="book-filters__field">
          <span>Author</span>
          <input
            value={value.author}
            onChange={(event) => onChange({ ...value, author: event.target.value })}
            autoComplete="off"
          />
        </label>
        <label className="book-filters__field">
          <span>Year from</span>
          <input
            inputMode="numeric"
            value={value.yearFrom}
            onChange={(event) => onChange({ ...value, yearFrom: event.target.value })}
          />
        </label>
        <label className="book-filters__field">
          <span>Year to</span>
          <input
            inputMode="numeric"
            value={value.yearTo}
            onChange={(event) => onChange({ ...value, yearTo: event.target.value })}
          />
        </label>
        <label className="book-filters__field">
          <span>Availability</span>
          <select
            value={value.available}
            onChange={(event) =>
              onChange({ ...value, available: event.target.value as AvailableFilter })
            }
          >
            <option value="">Any</option>
            <option value="true">Available</option>
            <option value="false">Borrowed</option>
          </select>
        </label>
      </div>
      <div className="book-filters__actions">
        <Button type="submit" disabled={disabled}>
          {disabled ? 'Searching…' : 'Search'}
        </Button>
        <Button type="button" variant="secondary" disabled={disabled} onClick={onClear}>
          Clear filters
        </Button>
      </div>
    </form>
  );
}
