import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface AnalyticsBarRow {
  name: string;
  borrowCount: number;
}

interface AnalyticsBarChartProps {
  rows: AnalyticsBarRow[];
  label?: string;
}

interface AxisTickProps {
  x?: number;
  y?: number;
  payload?: { value?: string | number };
}

const BAR_COLOR = '#3f5c54';
const LABEL_MAX = 22;

function truncateLabel(value: string, max = LABEL_MAX): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}…`;
}

function TruncatedAxisTick({ x = 0, y = 0, payload }: AxisTickProps) {
  const fullName = String(payload?.value ?? '');
  const displayName = truncateLabel(fullName);
  const isTruncated = displayName !== fullName;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill="var(--ink)"
        fontSize={12}
        fontFamily="var(--ui)"
      >
        {isTruncated ? <title>{fullName}</title> : null}
        {displayName}
      </text>
    </g>
  );
}

export function AnalyticsBarChart({ rows, label = 'Borrows' }: AnalyticsBarChartProps) {
  const height = Math.max(160, rows.length * 48);

  return (
    <div className="analytics-chart" style={{ width: '100%', height }} role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
          barCategoryGap="28%"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: 'var(--muted)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={128}
            tick={<TruncatedAxisTick />}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(63, 92, 84, 0.08)' }}
            formatter={(value) => [value, label]}
            labelFormatter={(value) => String(value)}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              fontFamily: 'var(--ui)',
              fontSize: 13,
            }}
          />
          <Bar dataKey="borrowCount" name={label} fill={BAR_COLOR} radius={[0, 6, 6, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
