import {
  DEFAULT_BOOK_LIST_QUERY,
  bookListQueryToSearchParams,
  type BookListQuery,
} from '../books/bookListQuery';
import type { AuthorDto } from '../../types/api';

export function booksPathForAuthor(author: Pick<AuthorDto, 'id' | 'name'>): string {
  const query: BookListQuery = {
    ...DEFAULT_BOOK_LIST_QUERY,
    page: 0,
    authorId: author.id != null ? String(author.id) : '',
    authorName: author.name,
    author: author.name,
  };
  const params = bookListQueryToSearchParams(query);
  return `/books?${params.toString()}`;
}
