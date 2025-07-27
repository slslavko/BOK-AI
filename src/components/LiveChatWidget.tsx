'use client';
import React, { useState, useEffect } from "react";

export default function LiveChatWidget() {
  const [minimized, setMinimized] = useState(true);
  const [botName, setBotName] = useState('BOK');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const name = localStorage.getItem('botName') || 'BOK';
      setBotName(name);
    }
  }, []);

  if (minimized) {
    return (
      <button
        className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 transition"
        onClick={() => setMinimized(false)}
        aria-label="Otwórz czat BOK"
      >
        <span className="text-xl font-bold">{botName[0]}</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-full bg-white/90 dark:bg-black/90 rounded-2xl shadow-2xl backdrop-blur-lg border border-gray-200 dark:border-gray-700 p-3 flex flex-col gap-2 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg border border-gray-300">{botName[0]}</div>
          <span className="font-bold text-base">{botName} BOK</span>
        </div>
        <button onClick={() => setMinimized(true)} className="text-gray-400 hover:text-blue-600 text-xl font-bold px-2" aria-label="Zminimalizuj czat">–</button>
      </div>
      <div className="flex-1 overflow-y-auto max-h-48 space-y-2">
        <div className="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-xl p-2 self-start w-fit">
          Dzień dobry! W czym mogę pomóc? 😊
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-2 self-end w-fit">
          Potrzebuję pomocy z zamówieniem.
        </div>
        <div className="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-xl p-2 self-start w-fit">
          Oczywiście! Proszę podać numer zamówienia lub opisać problem.
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <input className="flex-1 rounded-xl border px-3 py-2 text-sm bg-white dark:bg-black/80" placeholder="Napisz wiadomość..." disabled />
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:bg-blue-700 transition" disabled>Wyślij</button>
      </div>
      <div className="text-xs text-gray-500 mt-1">Widget demo – {botName} odpowiada natychmiast, naturalnie i po polsku.</div>
    </div>
  );
} 