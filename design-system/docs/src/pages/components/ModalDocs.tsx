import CodeBlock from '../../components/CodeBlock';

export default function ModalDocs() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Modal</h1>
        <p className="text-lg text-text-secondary">
          Modals display content in a layer above the main application, requiring user interaction.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Structure</h2>
        <CodeBlock
          code={`<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div className="bg-background-elevated rounded-lg shadow-lg max-w-md w-full p-6">
    <h2 className="text-xl font-semibold mb-4">Modal Title</h2>
    <p className="text-text-secondary mb-6">Modal content goes here...</p>
    <div className="flex justify-end gap-3">
      <button className="px-4 py-2 border rounded-lg">Cancel</button>
      <button className="px-4 py-2 bg-brand-primary text-white rounded-lg">Confirm</button>
    </div>
  </div>
</div>`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Accessibility</h2>
        <ul className="list-disc list-inside space-y-2 text-text-secondary">
          <li>Trap focus within the modal</li>
          <li>Close on ESC key press</li>
          <li>Use role="dialog" and aria-modal="true"</li>
          <li>Provide aria-labelledby for the title</li>
          <li>Return focus to trigger element on close</li>
        </ul>
      </section>
    </div>
  );
}
