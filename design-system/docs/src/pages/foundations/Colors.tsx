import CodeBlock from '../../components/CodeBlock';

interface ColorSwatchProps {
  name: string;
  variable: string;
  description: string;
}

function ColorSwatch({ name, variable, description }: ColorSwatchProps) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <div
        className="w-16 h-16 rounded-lg border shadow-sm"
        style={{ backgroundColor: `var(${variable})` }}
      />
      <div className="flex-1">
        <h4 className="font-semibold">{name}</h4>
        <code className="text-sm text-text-muted">{variable}</code>
        <p className="text-sm text-text-secondary mt-1">{description}</p>
      </div>
    </div>
  );
}

export default function Colors() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Colors</h1>
        <p className="text-lg text-text-secondary">
          Our color system provides semantic tokens that adapt to light and dark modes, ensuring consistent and accessible color usage throughout the application.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Brand Colors</h2>
        <p className="text-text-secondary">
          Primary brand colors used for key actions, links, and brand identity.
        </p>
        <div className="grid gap-4">
          <ColorSwatch
            name="Primary"
            variable="--color-brand-primary"
            description="Main brand color for buttons, links, and primary actions"
          />
          <ColorSwatch
            name="Secondary"
            variable="--color-brand-secondary"
            description="Secondary brand color for accents and highlights"
          />
          <ColorSwatch
            name="Accent"
            variable="--color-brand-accent"
            description="Accent color for special emphasis"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Text Colors</h2>
        <p className="text-text-secondary">
          Semantic text colors that ensure proper contrast and readability.
        </p>
        <div className="grid gap-4">
          <ColorSwatch
            name="Primary Text"
            variable="--color-text-primary"
            description="Main text color for body content and headings"
          />
          <ColorSwatch
            name="Secondary Text"
            variable="--color-text-secondary"
            description="Secondary text for less prominent content"
          />
          <ColorSwatch
            name="Muted Text"
            variable="--color-text-muted"
            description="Muted text for hints and subtle information"
          />
          <ColorSwatch
            name="Disabled Text"
            variable="--color-text-disabled"
            description="Text color for disabled elements"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Background Colors</h2>
        <p className="text-text-secondary">
          Background colors for different surface levels and contexts.
        </p>
        <div className="grid gap-4">
          <ColorSwatch
            name="Base"
            variable="--color-background-base"
            description="Main background color for the application"
          />
          <ColorSwatch
            name="Elevated"
            variable="--color-background-elevated"
            description="Background for elevated surfaces like cards and modals"
          />
          <ColorSwatch
            name="Subtle"
            variable="--color-background-subtle"
            description="Subtle background for hover states and highlights"
          />
          <ColorSwatch
            name="Muted"
            variable="--color-background-muted"
            description="Muted background for code blocks and disabled states"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Status Colors</h2>
        <p className="text-text-secondary">
          Colors for communicating status and feedback to users.
        </p>
        <div className="grid gap-4">
          <ColorSwatch
            name="Success"
            variable="--color-status-success"
            description="Indicates successful operations"
          />
          <ColorSwatch
            name="Warning"
            variable="--color-status-warning"
            description="Indicates warnings or caution"
          />
          <ColorSwatch
            name="Error"
            variable="--color-status-error"
            description="Indicates errors or destructive actions"
          />
          <ColorSwatch
            name="Info"
            variable="--color-status-info"
            description="Indicates informational messages"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Usage Examples</h2>
        
        <CodeBlock
          title="Using color tokens in Tailwind"
          code={`<div className="bg-background-elevated text-text-primary">
  <h2 className="text-brand-primary">Heading</h2>
  <p className="text-text-secondary">Description</p>
  <button className="bg-brand-primary text-white">
    Action
  </button>
</div>`}
        />

        <CodeBlock
          title="Using color tokens in CSS"
          code={`.card {
  background-color: var(--color-background-elevated);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
}

.card-title {
  color: var(--color-brand-primary);
}

.card-description {
  color: var(--color-text-secondary);
}`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Accessibility</h2>
        <p className="text-text-secondary">
          All color combinations meet WCAG AA standards for contrast ratios:
        </p>
        <ul className="list-disc list-inside space-y-2 text-text-secondary">
          <li>Normal text: minimum 4.5:1 contrast ratio</li>
          <li>Large text (18px+): minimum 3:1 contrast ratio</li>
          <li>UI components: minimum 3:1 contrast ratio</li>
        </ul>
      </section>
    </div>
  );
}
