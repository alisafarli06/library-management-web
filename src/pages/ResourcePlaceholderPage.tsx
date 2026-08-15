import { EmptyState, PageHeader } from '../components/ui/Primitives';

interface ResourcePlaceholderPageProps {
  title: string;
  summary: string;
}

export function ResourcePlaceholderPage({ title, summary }: ResourcePlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={summary} />
      <EmptyState
        title="This section will be available soon."
        body="This workspace is reserved for the live Library Management API. Records will load here once the screen is implemented."
      />
    </div>
  );
}
