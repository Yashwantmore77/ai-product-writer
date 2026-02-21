"use client";

export default function OutputCard({ platform, description, onCopy, onDownload, onRegenerate }) {
  const platformColors = {
    amazon: { bgColor: "from-orange-500/20", borderColor: "border-orange-500/30", textColor: "text-orange-300", label: "Amazon" },
    ebay: { bgColor: "from-red-500/20", borderColor: "border-red-500/30", textColor: "text-red-300", label: "eBay" },
    shopify: { bgColor: "from-green-500/20", borderColor: "border-green-500/30", textColor: "text-green-300", label: "Shopify" },
  };

  const colors = platformColors[platform] || platformColors.amazon;

  if (!description) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center min-h-96">
        <svg
          className="w-16 h-16 text-gray-400 mb-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-gray-400 text-center">
          Your AI-generated description will appear here
        </p>
        <p className="text-gray-500 text-sm text-center mt-2">
          Fill in product details and click Generate
        </p>
      </div>
    );
  }

  return (
    <div className={`glass-card overflow-hidden border-l-4 border-gradient-to-b ${colors.borderColor}`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${colors.bgColor} to-transparent p-6 border-b border-white/10 flex items-center justify-between`}>
        <span className={colors.textColor}>{colors.label}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className="glass-button p-2"
            title="Copy to clipboard"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
          <button
            onClick={onDownload}
            className="glass-button p-2"
            title="Download"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
          <button
            onClick={onRegenerate}
            className="glass-button p-2"
            title="Regenerate"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="prose prose-invert max-w-none">
          <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
            {description}
          </div>
        </div>

        {/* Character/Word Count */}
        <div className="mt-6 pt-6 border-t border-white/10 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Characters:</span>
            <span className={description.length > 500 ? "text-yellow-400" : "text-green-400"}>
              {description.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Words:</span>
            <span className={description.split(/\s+/).length > 100 ? "text-yellow-400" : "text-green-400"}>
              {description.split(/\s+/).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
