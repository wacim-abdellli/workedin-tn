import CodeBlock from '../../components/CodeBlock';

export default function Typography() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Typography</h1>
        <p className="text-lg text-text-secondary">
          Our typography system ensures consistent, readable, and accessible text across all interfaces.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Font Families</h2>
        <div className="space-y-4">
          <div className="p-6 border rounded-lg">
            <p className="text-sm text-text-muted mb-2">Sans-serif (Default)</p>
            <p className="text-2xl font-sans">Inter - The quick brown fox jumps over the lazy dog</p>
            <code className="text-sm text-text-muted">font-family: 'Inter', system-ui, sans-serif</code>
          </div>
          <div className="p-6 border rounded-lg">
            <p className="text-sm text-text-muted mb-2">Monospace (Code)</p>
            <p className="text-2xl font-mono">Fira Code - The quick brown fox jumps over the lazy dog</p>
            <code className="text-sm text-text-muted">font-family: 'Fira Code', monospace</code>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Type Scale</h2>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <p className="text-xs mb-2">Extra Small (xs) - 12px</p>
            <code className="text-xs text-text-muted">text-xs</code>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm mb-2">Small (sm) - 14px</p>
            <code className="text-xs text-text-muted">text-sm</code>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-base mb-2">Base - 16px</p>
            <code className="text-xs text-text-muted">text-base</code>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-lg mb-2">Large (lg) - 18px</p>
            <code className="text-xs text-text-muted">text-lg</code>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-xl mb-2">Extra Large (xl) - 20px</p>
            <code className="text-xs text-text-muted">text-xl</code>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-2xl mb-2">2XL - 24px</p>
            <code className="text-xs text-text-muted">text-2xl</code>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-3xl mb-2">3XL - 30px</p>
            <code className="text-xs text-text-muted">text-3xl</code>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-4xl mb-2">4XL - 36px</p>
            <code className="text-xs text-text-muted">text-4xl</code>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Font Weights</h2>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <p className="font-light text-lg mb-2">Light (300)</p>
            <code className="text-xs text-text-muted">font-light</code>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="font-normal text-lg mb-2">Normal (400)</p>
            <code className="text-xs text-text-muted">font-normal</code>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="font-medium text-lg mb-2">Medium (500)</p>
            <code className="text-xs text-text-muted">font-medium</code>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="font-semibold text-lg mb-2">Semibold (600)</p>
            <code className="text-xs text-text-muted">font-semibold</code>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="font-bold text-lg mb-2">Bold (700)</p>
            <code className="text-xs text-text-muted">font-bold</code>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="font-extrabold text-lg mb-2">Extra Bold (800)</p>
            <code className="text-xs text-text-muted">font-extrabold</code>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Usage Guidelines</h2>
        <div className="space-y-4">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Headings</h3>
            <p className="text-text-secondary mb-4">Use semibold or bold weights for headings to establish clear hierarchy.</p>
            <CodeBlock
              code={`<h1 className="text-4xl font-bold">Page Title</h1>
<h2 className="text-2xl font-semibold">Section Title</h2>
<h3 className="text-xl font-semibold">Subsection</h3>`}
            />
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Body Text</h3>
            <p className="text-text-secondary mb-4">Use normal weight for body text with appropriate line height.</p>
            <CodeBlock
              code={`<p className="text-base font-normal leading-relaxed">
  Body text content goes here...
</p>`}
            />
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Code</h3>
            <p className="text-text-secondary mb-4">Use monospace font for code snippets and technical content.</p>
            <CodeBlock
              code={`<code className="font-mono text-sm">
  const example = "code";
</code>`}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
