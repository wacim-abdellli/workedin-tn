export default function ToastDocs() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Toast</h1>
        <p className="text-lg text-text-secondary">
          Toast notifications provide brief, non-intrusive feedback about
          operations.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Types</h2>
        <div className="space-y-3">
          <div className="p-4 bg-green-100 border border-green-200 rounded-lg flex items-center gap-3">
            <span className="text-green-600">✓</span>
            <span className="text-green-800">
              Success: Operation completed successfully
            </span>
          </div>
          <div className="p-4 bg-red-100 border border-red-200 rounded-lg flex items-center gap-3">
            <span className="text-red-600">✕</span>
            <span className="text-red-800">Error: Something went wrong</span>
          </div>
          <div className="p-4 bg-yellow-100 border border-yellow-200 rounded-lg flex items-center gap-3">
            <span className="text-yellow-600">⚠</span>
            <span className="text-yellow-800">
              Warning: Please review your input
            </span>
          </div>
          <div className="p-4 bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-3">
            <span className="text-blue-600">ℹ</span>
            <span className="text-blue-800">Info: Here's some information</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Guidelines</h2>
        <ul className="list-disc list-inside space-y-2 text-text-secondary">
          <li>Keep messages brief and actionable</li>
          <li>Auto-dismiss after 3-5 seconds</li>
          <li>Position at top-right or bottom-right</li>
          <li>Allow manual dismissal</li>
          <li>Stack multiple toasts vertically</li>
        </ul>
      </section>
    </div>
  );
}
