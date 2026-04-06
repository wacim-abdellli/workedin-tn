import CodeBlock from '../../components/CodeBlock';

export default function Shadows() {
  const shadows = [
    { name: 'None', variable: '--shadow-none', description: 'No shadow' },
    { name: 'Small', variable: '--shadow-sm', description: 'Subtle elevation for cards' },
    { name: 'Medium', variable: '--shadow-md', description: 'Standard elevation for dropdowns' },
    { name: 'Large', variable: '--shadow-lg', description: 'High elevation for modals' },
    { name: 'Extra Large', variable: '--shadow-xl', description: 'Maximum elevation for popovers' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Shadows</h1>
        <p className="text-lg text-text-secondary">
          Shadows create depth and hierarchy, helping users understand the layering of interface elements.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Elevation Levels</h2>
        <p className="text-text-secondary">
          Our shadow system provides five elevation levels, from flat surfaces to floating elements.
        </p>
        <div className="grid gap-6">
          {shadows.map((shadow) => (
            <div key={shadow.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{shadow.name}</h3>
                <code className="text-sm text-text-muted">{shadow.variable}</code>
              </div>
              <p className="text-sm text-text-secondary">{shadow.description}</p>
              <div
                className="h-32 bg-background-elevated rounded-lg flex items-center justify-center"
                style={{ boxShadow: `var(${shadow.variable})` }}
              >
                <span className="text-text-muted">Preview</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Usage Examples</h2>
        
        <CodeBlock
          title="Using shadows in Tailwind"
          code={`<div className="shadow-sm">Small shadow</div>
<div className="shadow-md">Medium shadow</div>
<div className="shadow-lg">Large shadow</div>`}
        />

        <CodeBlock
          title="Using shadows in CSS"
          code={`.card {
  box-shadow: var(--shadow-sm);
}

.dropdown {
  box-shadow: var(--shadow-md);
}

.modal {
  box-shadow: var(--shadow-lg);
}`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Guidelines</h2>
        <div className="space-y-4">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">When to Use Shadows</h3>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li>Cards and panels: Use shadow-sm for subtle elevation</li>
              <li>Dropdowns and menus: Use shadow-md for clear separation</li>
              <li>Modals and dialogs: Use shadow-lg for prominent elevation</li>
              <li>Tooltips and popovers: Use shadow-xl for maximum emphasis</li>
            </ul>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Dark Mode Considerations</h3>
            <p className="text-text-secondary">
              Shadows are automatically adjusted for dark mode to maintain appropriate contrast and depth perception.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
