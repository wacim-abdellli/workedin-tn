import CodeBlock from '../../components/CodeBlock';

export default function InputDocs() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Input</h1>
        <p className="text-lg text-text-secondary">
          Input fields allow users to enter and edit text data.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Basic Input</h2>
        <input
          type="text"
          placeholder="Enter text..."
          className="w-full px-4 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
        
        <CodeBlock
          code={`<input
  type="text"
  placeholder="Enter text..."
  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary"
/>`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">With Label</h2>
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full px-4 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">States</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Default</label>
            <input type="text" className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Disabled</label>
            <input type="text" disabled className="w-full px-4 py-2 border rounded-lg opacity-50 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-red-600">Error</label>
            <input type="text" className="w-full px-4 py-2 border border-red-500 rounded-lg" />
            <p className="text-sm text-red-600 mt-1">This field is required</p>
          </div>
        </div>
      </section>
    </div>
  );
}
