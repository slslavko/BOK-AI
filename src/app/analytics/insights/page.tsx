'use client';
import React from "react";

export default function AIInsights() {
  return (
    <div className="bg-white/80 dark:bg-black/80 p-6 rounded-2xl shadow border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2">AI Insights</h2>
      <ul className="list-disc pl-5 space-y-1 text-sm mb-4">
        <li>Przewidywany wzrost liczby zapytań: <span className="font-semibold text-blue-600">+12%</span> w przyszłym tygodniu</li>
        <li>Najczęstsze pytanie: <span className="font-semibold">"Gdzie jest moja paczka?"</span></li>
        <li>Sugestia: Zwiększ autonomię bota w godzinach szczytu</li>
        <li>Automatyczna rekomendacja: Dodaj sekcję FAQ o promocjach i kodach rabatowych</li>
      </ul>
    </div>
  );
} 