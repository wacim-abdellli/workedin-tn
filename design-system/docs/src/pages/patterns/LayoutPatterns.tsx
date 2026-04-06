import CodeBlock from '../../components/CodeBlock';

export default function LayoutPatterns() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Layout Patterns</h1>
        <p className="text-lg text-text-secondary">
          Common layout patterns and best practices for structuring your pages.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Grid vs Flexbox</h2>
        <div className="space-y-4">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Use Grid for:</h3>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li>Two-dimensional layouts (rows and columns)</li>
              <li>Complex page layouts with multiple regions</li>
              <li>When you need precise control over both axes</li>
            </ul>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Use Flexbox for:</h3>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li>One-dimensional layouts (row or column)</li>
              <li>Component-level layouts</li>
              <li>When you need flexible spacing and alignment</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Responsive Breakpoints</h2>
        <div className="space-y-2">
          <div className="p-4 border rounded-lg">
            <code className="font-semibold">sm: 640px</code> - Mobile landscape
          </div>
          <div className="p-4 border rounded-lg">
            <code className="font-semibold">md: 768px</code> - Tablet
          </div>
          <div className="p-4 border rounded-lg">
            <code className="font-semibold">lg: 1024px</code> - Desktop
          </div>
          <div className="p-4 border rounded-lg">
            <code className="font-semibold">xl: 1280px</code> - Large desktop
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Common Patterns</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Container</h3>
            <CodeBlock
              code={`<div className="container mx-auto px-4 max-w-7xl">
  Content
</div>`}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Two Column Layout</h3>
            <CodeBlock
              code={`<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>Column 1</div>
  <div>Column 2</div>
</div>`}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Sidebar Layout</h3>
            <CodeBlock
              code={`<div className="flex gap-6">
  <aside className="w-64 flex-shrink-0">Sidebar</aside>
  <main className="flex-1">Main content</main>
</div>`}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Card Grid</h3>
            <CodeBlock
              code={`<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div className="p-6 border rounded-lg">Card 1</div>
  <div className="p-6 border rounded-lg">Card 2</div>
  <div className="p-6 border rounded-lg">Card 3</div>
</div>`}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
