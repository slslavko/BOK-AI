'use client';
import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function DarkLightModeSwitch() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Odczytaj preferencje z localStorage lub systemowe
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') setDark(true);
      else if (saved === 'light') setDark(false);
      else setDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const html = document.documentElement;
      if (dark) {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(d => !d)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold shadow border border-gray-200 dark:border-gray-700 transition-all duration-500 bg-white/80 dark:bg-[#23244a] text-blue-600 dark:text-yellow-300 hover:scale-105`}
      aria-label="Przełącz tryb nocny/dzienny"
    >
      {dark ? <Moon className="w-5 h-5 animate-spin-slow" /> : <Sun className="w-5 h-5 animate-bounce" />}
      {dark ? 'Tryb nocny' : 'Tryb dzienny'}
    </button>
  );
} 