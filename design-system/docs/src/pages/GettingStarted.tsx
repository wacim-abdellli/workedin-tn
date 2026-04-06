import CodeBlock from '../components/CodeBlock';

export default function GettingStarted() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Getting Started</h1>
        <p className="text-lg text-text-secondary">
          Welcome to the Khedma TN Design System documentation. This comprehensive guide will help you build consistent, accessible, and beautiful user interfaces.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">What is a Design System?</h2>
        <p className="text-text-secondary">
          A design system is a collection of reusable components, design tokens, and guidelines that ensure consistency across your application. It serves as a single source of truth for designers and developers.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Installation</h2>
        <p className="text-text-secondary">
          The design system is already integrated into the Khedma TN project. All design tokens are available as CSS custom properties.
        </p>
        
        <CodeBlock
          title="Import design tokens"
          code={`import '../design-system/output/tokens.css';`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Using Design Tokens</h2>
        <p className="text-text-secondary">
          Design tokens are available as CSS variables and can be used in your Tailwind classes or custom CSS.
        </p>
        
        <CodeBlock
          title="Using tokens in Tailwind"
          code={`<button className="bg-brand-primary text-white">
  Click me
</button>`}
        />

        <CodeBlock
          title="Using tokens in CSS"
          code={`.my-component {
  background-color: var(--color-brand-primary);
  color: var(--color-text-primary);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
}`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Theme Support</h2>
        <p className="text-text-secondary">
          The design system supports both light and dark modes. Toggle the theme using the button in the header to see how colors adapt.
        </p>
        
        <CodeBlock
          title="Implementing theme toggle"
          code={`// Add 'dark' class to html element
document.documentElement.classList.toggle('dark');

// Save preference
localStorage.setItem('theme', 'dark');`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Next Steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/foundations/colors"
            className="p-6 border rounded-lg hover:border-brand-primary transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">Explore Foundations</h3>
            <p className="text-sm text-text-secondary">
              Learn about colors, typography, spacing, and other foundational elements.
            </p>
          </a>
          
          <a
            href="/components/button"
            className="p-6 border rounded-lg hover:border-brand-primary transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">Browse Components</h3>
            <p className="text-sm text-text-secondary">
              Discover pre-built components with examples and usage guidelines.
            </p>
          </a>
          
          <a
            href="/patterns/layout"
            className="p-6 border rounded-lg hover:border-brand-primary transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">View Patterns</h3>
            <p className="text-sm text-text-secondary">
              Explore common layout patterns and best practices.
            </p>
          </a>
          
          <a
            href="/resources/migration"
            className="p-6 border rounded-lg hover:border-brand-primary transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">Migration Guide</h3>
            <p className="text-sm text-text-secondary">
              Learn how to migrate existing pages to the design system.
            </p>
          </a>
        </div>
      </section>
    </div>
  );
}
