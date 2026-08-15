interface AnalyticsRankedRow {
  id: number;
  name: string;
  borrowCount: number;
}

interface AnalyticsRankedTableProps {
  nameHeader: string;
  rows: AnalyticsRankedRow[];
  loading: boolean;
}

export function AnalyticsRankedTable({ nameHeader, rows, loading }: AnalyticsRankedTableProps) {
  return (
    <div className="analytics-table-wrap">
      <table className="analytics-table">
        <thead>
          <tr>
            <th>{nameHeader}</th>
            <th>Borrow Count</th>
          </tr>
        </thead>
        <tbody>
          {loading && rows.length === 0
            ? Array.from({ length: 5 }, (_, index) => (
                <tr key={`skeleton-${index}`} className="analytics-table__skeleton">
                  <td colSpan={2}>Loading analytics…</td>
                </tr>
              ))
            : rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.borrowCount}</td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
