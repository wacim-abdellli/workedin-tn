import { useState } from "react";
import { Copy, Check } from "lucide-react";
import clsx from "clsx";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export default function CodeBlock({ code, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      {title && (
        <div className="px-4 py-2 bg-background-muted border border-b-0 rounded-t-lg text-sm font-medium text-text-secondary">
          {title}
        </div>
      )}
      <div
        className={clsx(
          "relative bg-background-muted border overflow-x-auto",
          title ? "rounded-b-lg" : "rounded-lg",
        )}
      >
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 rounded-lg bg-background-elevated hover:bg-background-subtle transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
        <pre className="p-4 text-sm">
          <code className="font-mono text-text-primary">{code}</code>
        </pre>
      </div>
    </div>
  );
}
