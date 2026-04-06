export default function Changelog() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Changelog</h1>
        <p className="text-lg text-text-secondary">
          Track updates, improvements, and changes to the design system.
        </p>
      </div>

      <section className="space-y-6">
        <div className="border-l-4 border-brand-primary pl-6">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold">v1.0.0</h2>
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Latest</span>
          </div>
          <p className="text-sm text-text-muted mb-4">January 2025</p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-green-600 mb-2">Added</h3>
              <ul className="list-disc list-inside space-y-1 text-text-secondary">
                <li>Initial design system documentation site</li>
                <li>Complete color system with semantic tokens</li>
                <li>Typography scale and guidelines</li>
                <li>Spacing system with consistent values</li>
                <li>Shadow and elevation system</li>
                <li>Animation guidelines and timing functions</li>
                <li>Component documentation (Button, Input, Badge, Modal, Toast, Loading)</li>
                <li>Layout patterns and responsive guidelines</li>
                <li>Migration guide and tools</li>
                <li>Light and dark mode support</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-blue-600 mb-2">Changed</h3>
              <ul className="list-disc list-inside space-y-1 text-text-secondary">
                <li>Standardized all color tokens across the application</li>
                <li>Updated spacing scale to use 4px base unit</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-l-4 border-border-default pl-6 opacity-60">
          <h2 className="text-xl font-semibold mb-2">v0.1.0</h2>
          <p className="text-sm text-text-muted mb-4">December 2024</p>
          
          <div>
            <h3 className="font-semibold text-green-600 mb-2">Added</h3>
            <ul className="list-disc list-inside space-y-1 text-text-secondary">
              <li>Initial token definitions</li>
              <li>Token compiler for generating CSS variables</li>
              <li>Basic color palette</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Upcoming</h2>
        <div className="p-6 border border-dashed rounded-lg">
          <h3 className="font-semibold mb-2">Planned Features</h3>
          <ul className="list-disc list-inside space-y-1 text-text-secondary">
            <li>Interactive component playground</li>
            <li>More component documentation</li>
            <li>Advanced pattern examples</li>
            <li>Figma design kit</li>
            <li>Icon library documentation</li>
            <li>Form validation patterns</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
