import CodeBlock from '../../components/CodeBlock';

export default function BadgeDocs() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Badge</h1>
        <p className="text-lg text-text-secondary">
          Badges display status, categories, or counts in a compact format.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Status Badges</h2>
        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">Success</span>
          <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">Warning</span>
          <span className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full">Error</span>
          <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">Info</span>
        </div>
        
        <CodeBlock
          code={`<span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
  Success
</span>`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Variants</h2>
        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-1 text-sm bg-purple-600 text-white rounded-full">Solid</span>
          <span className="px-3 py-1 text-sm border border-purple-600 text-purple-600 rounded-full">Outline</span>
          <span className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-full">Subtle</span>
        </div>
      </section>
    </div>
  );
}
