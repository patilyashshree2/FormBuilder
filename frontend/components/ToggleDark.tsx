"use client";
import { useEffect, useState } from "react";

export default function ToggleDark() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const html = document.documentElement;
    if (enabled) html.classList.add("dark");
    else html.classList.remove("dark");
  }, [enabled]);

  return (
    <button
      className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700"
      onClick={() => setEnabled(v => !v)}
      aria-label="Toggle dark mode"
    >
      {enabled ? "Light" : "Dark"}
    </button>
  );
}
