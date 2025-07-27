"use client";
import * as React from "react";
import { Slider } from "@radix-ui/react-slider";

const levels = [
  "Tylko drafty do akceptacji",
  "Autonomia z alertami",
  "Pełna autonomia",
];

export default function AutonomySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="w-full max-w-md flex flex-col items-center gap-4">
      <Slider
        min={0}
        max={2}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="relative w-full h-6 flex items-center"
      >
        <div className="absolute left-0 right-0 h-2 rounded-full bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-300 opacity-80 dark:from-violet-500 dark:via-blue-500 dark:to-cyan-400" />
        <div className="absolute left-0 right-0 h-2 rounded-full border border-gray-200 dark:border-white/20 bg-gray-100 dark:bg-white/10" />
        {levels.map((_, i) => (
          <span
            key={i}
            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all duration-200 ${value === i ? "border-violet-500 bg-violet-400 dark:border-violet-400 dark:bg-violet-500" : "border-gray-300 bg-white dark:border-white/30 dark:bg-white/10"}`}
            style={{ left: `${i * 50}%`, zIndex: 2 }}
          />
        ))}
        <span
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-400 border-4 border-white shadow-lg transition-all duration-200"
          style={{ left: `${value * 50}%`, zIndex: 3 }}
        />
      </Slider>
      <div className="w-full flex justify-between text-xs mt-2">
        {levels.map((label, i) => (
          <span key={i} className={`text-center w-1/3 ${value === i ? "text-violet-700 dark:text-violet-300 font-bold" : "text-gray-700 dark:text-white/60"}`}>{label}</span>
        ))}
      </div>
    </div>
  );
} 