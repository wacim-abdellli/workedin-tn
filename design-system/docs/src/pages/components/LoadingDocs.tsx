import CodeBlock from '../../components/CodeBlock';

export default function LoadingDocs() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Loading States</h1>
        <p className="text-lg text-text-secondary">
          Loading indicators communicate that content is being fetched or processed.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Spinner</h2>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <div className="w-6 h-6 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <div className="w-4 h-4 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
        
        <CodeBlock
          code={`<div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Skeleton</h2>
        <div className="space-y-3">
          <div className="h-4 bg-background-muted rounded animate-pulse" />
          <div className="h-4 bg-background-muted rounded animate-pulse w-3/4" />
          <div className="h-4 bg-background-muted rounded animate-pulse w-1/2" />
        </div>
        
        <CodeBlock
          code={`<div className="space-y-3">
  <div className="h-4 bg-background-muted rounded animate-pulse" />
  <div className="h-4 bg-background-muted rounded animate-pulse w-3/4" />
</div>`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Guidelines</h2>
        <ul className="list-disc list-inside space-y-2 text-text-secondary">
          <li>Use spinners for short waits (under 3 seconds)</li>
          <li>Use skeletons for content that's loading</li>
          <li>Show progress bars for long operations</li>
          <li>Provide feedback within 100ms of user action</li>
        </ul>
      </section>
    </div>
  );
}
