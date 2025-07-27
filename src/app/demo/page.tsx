'use client';

import React, { useState } from "react";

const steps = [
  { label: "Nowa wiadomość od klienta", type: "msg" },
  { label: "Powiadomienie: Nowa rozmowa oczekuje na odpowiedź", type: "notif" },
  { label: "Bot przygotowuje draft odpowiedzi...", type: "draft" },
  { label: "Czy wysłać odpowiedź?", type: "choice" },
];

export default function DemoPage() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState(false);

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else setSent(true);
  };
  const reset = () => { setOpen(false); setStep(0); setSent(false); };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 dark:from-gray-900 dark:to-blue-900">
      <h1 className="text-3xl font-bold mb-4">Tryb demo: Symuluj dzień pracy</h1>
      <button onClick={() => setOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:bg-blue-700 transition mb-8">Rozpocznij symulację</button>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl max-w-lg w-full animate-fade-in flex flex-col items-center gap-6">
            <h2 className="text-xl font-bold mb-2">Symulacja dnia pracy BOK</h2>
            <div className="w-full flex flex-col gap-4 items-center">
              {step >= 0 && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-base font-medium text-gray-800 dark:text-white">{steps[0].label}</span>
                </div>
              )}
              {step >= 1 && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-base font-medium text-green-700 dark:text-green-300">{steps[1].label}</span>
                </div>
              )}
              {step >= 2 && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <span className="inline-block w-3 h-3 rounded-full bg-violet-500 animate-pulse" />
                  <span className="text-base font-medium text-violet-700 dark:text-violet-300">{steps[2].label}</span>
                </div>
              )}
              {step >= 3 && !sent && (
                <div className="flex flex-col items-center gap-2 animate-fade-in">
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-base font-medium text-yellow-700 dark:text-yellow-200">{steps[3].label}</span>
                  <div className="flex gap-4 mt-2">
                    <button onClick={next} className="bg-violet-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:bg-violet-700 transition">Wyślij</button>
                    <button onClick={reset} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white px-4 py-2 rounded-xl font-semibold shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition">Odrzuć</button>
                  </div>
                </div>
              )}
              {sent && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-base font-bold text-green-700 dark:text-green-300">Odpowiedź wysłana!</span>
                </div>
              )}
            </div>
            {!sent && step < 3 && (
              <button onClick={next} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:bg-blue-700 transition mt-4">Dalej</button>
            )}
            <button onClick={reset} className="mt-2 text-sm text-gray-500 hover:underline">Zamknij</button>
          </div>
        </div>
      )}
    </div>
  );
} 