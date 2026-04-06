import CodeBlock from '../../components/CodeBlock';

export default function Spacing() {
  const spacingScale = [
    { name: '0', value: '0px', variable: '--spacing-0' },
    { name: '1', value: '4px', variable: '--spacing-1' },
    { name: '2', value: '8px', variable: '--spacing-2' },
    { name: '3', value: '12px', variable: '--spacing-3' },
    { name: '4', value: '16px', variable: '--spacing-4' },
    { name: '5', value: '20px', variable: '--spacing-5' },
    { name: '6', value: '24px', variable: '--spacing-6' },
    { name: '8', value: '32px', variable: '--spacing-8' },
    { name: '10', value: '40px', variable: '--spacing-10' },
    { name: '12', value: '48px', variable: '--spacing-12' },
    { name: '16', value: '64px', variable: '--spacing-16' },
    { name: '20', value: '80px', variable: '--spacing-20' },
    { name: '24', value: '96px', variable: '--spacing-24' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Spacing</h1>
        <p className="text-lg text-text-secondary">
          Our spacing system provides consistent margins, padding, and gaps throughout the application.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Spacing Scale</h2>
        <p className="text-text-secondary">
          The spacing scale is based on a 4px base unit, providing a harmonious rhythm across the interface.
        </p>
        <div className="space-y-2">
          {spacingScale.map((space) => (
            <div key={space.name} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-24 text-sm font-mono">{space.name}</div>
              <div className="w-24 text-sm text-text-muted">{space.value}</div>
              <div
                className="h-8 bg-brand-primary rounded"
                style={{ width: space.value }}
              />
              <code className="text-sm text-text-muted flex-1">{space.variable}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Usage Examples</h2>
        
        <div className="space-y-4">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Padding</h3>
            <CodeBlock
              code={`<!-- Using Tailwind utilities -->
<div className="p-4">Padding 16px</div>
<div className="px-6 py-3">Horizontal 24px, Vertical 12px</div>

<!-- Using CSS variables -->
.card {
  padding: var(--spacing-6);
}`}
            />
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Margin</h3>
            <CodeBlock
              code={`<!-- Using Tailwind utilities -->
<div className="mb-4">Margin bottom 16px</div>
<div className="mt-8">Margin top 32px</div>

<!-- Using CSS variables -->
.section {
  margin-bottom: var(--spacing-8);
}`}
            />
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Gap (Flexbox/Grid)</h3>
            <CodeBlock
              code={`<!-- Using Tailwind utilities -->
<div className="flex gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Using CSS variables -->
.grid-container {
  display: grid;
  gap: var(--spacing-6);
}`}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Guidelines</h2>
        <div className="space-y-4">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Component Spacing</h3>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li>Use spacing-2 (8px) for tight spacing within components</li>
              <li>Use spacing-4 (16px) for standard component padding</li>
              <li>Use spacing-6 (24px) for comfortable spacing between sections</li>
              <li>Use spacing-8 (32px) or larger for major section breaks</li>
            </ul>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Responsive Spacing</h3>
            <p className="text-text-secondary mb-4">
              Adjust spacing for different screen sizes to maintain optimal density.
            </p>
            <CodeBlock
              code={`<div className="p-4 md:p-6 lg:p-8">
  Responsive padding
</div>`}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
