import React from "react";

export default function ProviderPicker({ provider, setProvider }) {
  return (
    <div className="w-full">

      <label className="block text-sm text-white/70 mb-1">
        Provider
      </label>

      <select
        value={provider}
        onChange={(e) => setProvider(e.target.value)}
        className="
          w-full px-3 py-2 rounded-lg
          bg-white/10 border border-white/10
          text-white
          focus:outline-none focus:ring-2 focus:ring-purple-500/40
          backdrop-blur-xl
          appearance-none
        "
      >
        <option className="bg-[#0b0b15]" value="google">Google (Gemini)</option>
        <option className="bg-[#0b0b15]" value="dialogflow">Dialogflow</option>
      </select>

      {/* Custom dropdown arrow */}
      <div className="pointer-events-none relative -mt-7 mr-3 float-right opacity-60">
        ▼
      </div>

    </div>
  );
}
