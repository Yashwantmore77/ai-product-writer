"use client";

const PLATFORMS = [
  {
    id: "amazon",
    name: "Amazon",
    description: "Product description + features",
    color: "orange",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    activeBg: "bg-orange-500/20",
  },
  {
    id: "ebay",
    name: "eBay",
    description: "Item description format",
    color: "red",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    activeBg: "bg-red-500/20",
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "SEO-optimized copy",
    color: "green",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    activeBg: "bg-green-500/20",
  },
];

export default function PlatformSelector({ value, onChange }) {
  return (
    <div className="glass-card p-6">
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">
        Select Platform
      </label>
      <div className="grid grid-cols-3 gap-3">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.id}
            onClick={() => onChange(platform.id)}
            className={`p-4 rounded-xl border transition-all ${
              value === platform.id
                ? `${platform.activeBg} border-${platform.color}-400`
                : `${platform.bgColor} ${platform.borderColor}`
            }`}
          >
            <div className={`text-sm font-semibold text-${platform.color}-300`}>
              {platform.name}
            </div>
            <div className="text-xs text-gray-400 mt-1">{platform.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
