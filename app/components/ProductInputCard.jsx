"use client";

export default function ProductInputCard({ formData, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="glass-card p-6">
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">
        Product Information
      </label>

      <div className="space-y-4">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Product Name *
          </label>
          <input
            type="text"
            value={formData.productName || ""}
            onChange={(e) => handleChange("productName", e.target.value)}
            placeholder="e.g., Premium Stainless Steel Water Bottle"
            className="glass-input w-full"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Category/Type *
          </label>
          <input
            type="text"
            value={formData.category || ""}
            onChange={(e) => handleChange("category", e.target.value)}
            placeholder="e.g., Kitchen, Sports, Electronics"
            className="glass-input w-full"
          />
        </div>

        {/* Key Features */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Key Features *
          </label>
          <textarea
            value={formData.keyFeatures || ""}
            onChange={(e) => handleChange("keyFeatures", e.target.value)}
            placeholder="e.g., waterproof, 32oz capacity, BPA-free, vacuum-insulated"
            className="glass-input w-full h-24 resize-none"
          />
        </div>

        {/* Materials */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Materials
          </label>
          <input
            type="text"
            value={formData.materials || ""}
            onChange={(e) => handleChange("materials", e.target.value)}
            placeholder="e.g., stainless steel, silicone, bamboo"
            className="glass-input w-full"
          />
        </div>

        {/* Dimensions */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Dimensions/Size (Optional)
          </label>
          <input
            type="text"
            value={formData.dimensions || ""}
            onChange={(e) => handleChange("dimensions", e.target.value)}
            placeholder="e.g., 10 x 10 x 25 cm, 500g"
            className="glass-input w-full"
          />
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Audience (Optional)
          </label>
          <input
            type="text"
            value={formData.targetAudience || ""}
            onChange={(e) => handleChange("targetAudience", e.target.value)}
            placeholder="e.g., fitness enthusiasts, outdoor adventurers, office workers"
            className="glass-input w-full"
          />
        </div>

        {/* Info Helper */}
        <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <svg
            className="w-5 h-5 text-blue-300 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm text-blue-200">
            More details = better descriptions
          </span>
        </div>
      </div>
    </div>
  );
}
