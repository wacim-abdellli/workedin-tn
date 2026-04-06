import CodeBlock from '../../components/CodeBlock';

export default function Animations() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Animations</h1>
        <p className="text-lg text-text-secondary">
          Thoughtful animations enhance user experience by providing feedback, guiding attention, and creating a sense of continuity.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Duration</h2>
        <p className="text-text-secondary">
          Animation durations are carefully chosen to feel responsive without being jarring.
        </p>
        <div className="grid gap-4">
          <div className="p-6 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Fast</h3>
              <code className="text-sm text-text-muted">150ms</code>
            </div>
            <p className="text-sm text-text-secondary mb-4">For micro-interactions like hover states</p>
            <div className="h-12 bg-brand-primary rounded-lg transition-all duration-150 hover:scale-105 cursor-pointer flex items-center justify-center text-white">
              Hover me
            </div>
          </div>

          <div className="p-6 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Normal</h3>
              <code className="text-sm text-text-muted">250ms</code>
            </div>
            <p className="text-sm text-text-secondary mb-4">For standard transitions and state changes</p>
            <div className="h-12 bg-brand-primary rounded-lg transition-all duration-250 hover:scale-105 cursor-pointer flex items-center justify-center text-white">
              Hover me
            </div>
          </div>

          <div className="p-6 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Slow</h3>
              <code className="text-sm text-text-muted">350ms</code>
            </div>
            <p className="text-sm text-text-secondary mb-4">For complex animations and page transitions</p>
            <div className="h-12 bg-brand-primary rounded-lg transition-all duration-350 hover:scale-105 cursor-pointer flex items-center justify-center text-white">
              Hover me
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Easing Functions</h2>
        <p className="text-text-secondary">
          Easing functions control the acceleration curve of animations.
        </p>
        <div className="grid gap-4">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">Ease In</h3>
            <p className="text-sm text-text-secondary mb-4">Starts slow, ends fast - for elements exiting</p>
            <code className="text-sm text-text-muted">cubic-bezier(0.4, 0, 1, 1)</code>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">Ease Out</h3>
            <p className="text-sm text-text-secondary mb-4">Starts fast, ends slow - for elements entering</p>
            <code className="text-sm text-text-muted">cubic-bezier(0, 0, 0.2, 1)</code>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">Ease In Out</h3>
            <p className="text-sm text-text-secondary mb-4">Smooth acceleration and deceleration - for state changes</p>
            <code className="text-sm text-text-muted">cubic-bezier(0.4, 0, 0.2, 1)</code>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Common Patterns</h2>
        
        <div className="space-y-4">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Hover States</h3>
            <CodeBlock
              code={`<button className="transition-colors duration-150 hover:bg-brand-primary">
  Hover me
</button>`}
            />
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Fade In</h3>
            <CodeBlock
              code={`<div className="animate-in fade-in duration-250">
  Content appears
</div>`}
            />
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Slide In</h3>
            <CodeBlock
              code={`<div className="animate-in slide-in-from-bottom duration-350">
  Content slides up
</div>`}
            />
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Scale</h3>
            <CodeBlock
              code={`<button className="transition-transform duration-150 hover:scale-105">
  Scale on hover
</button>`}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Guidelines</h2>
        <div className="space-y-4">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Principles</h3>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li>Keep animations purposeful - every animation should serve a function</li>
              <li>Respect user preferences - honor prefers-reduced-motion</li>
              <li>Be consistent - use the same durations and easings for similar interactions</li>
              <li>Optimize performance - use transform and opacity for smooth 60fps animations</li>
            </ul>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Accessibility</h3>
            <p className="text-text-secondary mb-4">
              Always respect the user's motion preferences:
            </p>
            <CodeBlock
              code={`@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}`}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
