import CodeBlock from '../../components/CodeBlock';

export default function MigrationGuide() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Migration Guide</h1>
        <p className="text-lg text-text-secondary">
          Step-by-step guide to migrate existing pages to the design system.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Overview</h2>
        <p className="text-text-secondary">
          The migration process involves replacing hardcoded colors, inconsistent spacing, and custom components with design system tokens and standardized components.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Step 1: Import Design Tokens</h2>
        <p className="text-text-secondary">
          First, ensure design tokens are imported in your application:
        </p>
        <CodeBlock
          title="src/main.tsx or App.tsx"
          code={`import '../design-system/output/tokens.css';`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Step 2: Replace Hardcoded Colors</h2>
        <div className="space-y-4">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Before</h3>
            <CodeBlock
              code={`<div className="bg-gray-900 text-white">
  <h1 className="text-purple-600">Title</h1>
  <p className="text-gray-400">Description</p>
</div>`}
            />
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">After</h3>
            <CodeBlock
              code={`<div className="bg-background-elevated text-text-primary">
  <h1 className="text-brand-primary">Title</h1>
  <p className="text-text-secondary">Description</p>
</div>`}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Step 3: Standardize Spacing</h2>
        <div className="space-y-4">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Before</h3>
            <CodeBlock
              code={`<div className="p-5 mb-7">
  Content
</div>`}
            />
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">After</h3>
            <CodeBlock
              code={`<div className="p-6 mb-8">
  Content
</div>`}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Step 4: Update Components</h2>
        <p className="text-text-secondary">
          Replace custom component implementations with standardized versions from the design system.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Step 5: Test</h2>
        <ul className="list-disc list-inside space-y-2 text-text-secondary">
          <li>Visual regression testing in both light and dark modes</li>
          <li>Accessibility testing (keyboard navigation, screen readers)</li>
          <li>Responsive testing across breakpoints</li>
          <li>Cross-browser testing</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Automated Migration Tools</h2>
        <p className="text-text-secondary">
          Use the provided migration scripts to automate common replacements:
        </p>
        <CodeBlock
          code={`# Audit current token usage
npm run tokens:audit

# Run color migration script
node design-system/scripts/migrate-colors.js`}
        />
      </section>
    </div>
  );
}
