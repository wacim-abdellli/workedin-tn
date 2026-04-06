import CodeBlock from '../../components/CodeBlock';

export default function ButtonDocs() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Button</h1>
        <p className="text-lg text-text-secondary">
          Buttons trigger actions and enable user interactions throughout the application.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Variants</h2>
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-opacity">
            Primary
          </button>
          <button className="px-4 py-2 border border-border-default rounded-lg hover:bg-background-subtle transition-colors">
            Secondary
          </button>
          <button className="px-4 py-2 text-brand-primary hover:bg-background-subtle rounded-lg transition-colors">
            Ghost
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:opacity-90 transition-opacity">
            Danger
          </button>
        </div>
        
        <CodeBlock
          code={`<button className="px-4 py-2 bg-brand-primary text-white rounded-lg">
  Primary
</button>

<button className="px-4 py-2 border border-border-default rounded-lg">
  Secondary
</button>

<button className="px-4 py-2 text-brand-primary hover:bg-background-subtle rounded-lg">
  Ghost
</button>`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Sizes</h2>
        <div className="flex flex-wrap items-center gap-4">
          <button className="px-3 py-1.5 text-sm bg-brand-primary text-white rounded-lg">
            Small
          </button>
          <button className="px-4 py-2 bg-brand-primary text-white rounded-lg">
            Medium
          </button>
          <button className="px-6 py-3 text-lg bg-brand-primary text-white rounded-lg">
            Large
          </button>
        </div>
        
        <CodeBlock
          code={`<button className="px-3 py-1.5 text-sm">Small</button>
<button className="px-4 py-2">Medium</button>
<button className="px-6 py-3 text-lg">Large</button>`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">States</h2>
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-brand-primary text-white rounded-lg">
            Default
          </button>
          <button className="px-4 py-2 bg-brand-primary text-white rounded-lg opacity-90">
            Hover
          </button>
          <button className="px-4 py-2 bg-brand-primary text-white rounded-lg opacity-50 cursor-not-allowed" disabled>
            Disabled
          </button>
          <button className="px-4 py-2 bg-brand-primary text-white rounded-lg flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Loading
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Accessibility</h2>
        <ul className="list-disc list-inside space-y-2 text-text-secondary">
          <li>Use semantic <code>&lt;button&gt;</code> elements</li>
          <li>Provide clear, descriptive labels</li>
          <li>Ensure sufficient color contrast (4.5:1 minimum)</li>
          <li>Support keyboard navigation (Enter and Space keys)</li>
          <li>Include focus indicators</li>
          <li>Use aria-label for icon-only buttons</li>
        </ul>
      </section>
    </div>
  );
}
