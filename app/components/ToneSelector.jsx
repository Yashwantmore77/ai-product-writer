"use client";

const TONES = ["Professional", "Casual", "Luxury", "Fun"];

export default function ToneSelector({ value, onChange }) {
  return (
    <div className="glass-card p-6">
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Writing Tone
      </label>
      <div className="flex flex-wrap gap-2">
        {TONES.map((tone) => (
          <button
            key={tone}
            onClick={() => onChange(tone)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              value === tone
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20"
                : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
            }`}
          >
            {tone}
          </button>
        ))}
      </div>
    </div>
  );
}
