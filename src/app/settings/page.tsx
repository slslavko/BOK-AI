"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export default function SettingsPage() {
  // Escalation rules
  const [escalation, setEscalation] = useState("");
  // Autonomy slider
  const [autonomy, setAutonomy] = useState(2); // 1-3
  // Onboarding/chat
  const [botName, setBotName] = useState("");
  const [onboardingHistory, setOnboardingHistory] = useState([
    { sender: "bot", text: "Cześć! Zanim zaczniesz korzystać z BOK, chciałbym Cię lepiej poznać. Odpowiedz na kilka pytań, a dostosuję się do Twoich potrzeb." },
    { sender: "bot", text: "Jak chcesz, żeby Twój BOK się nazywał? (np. Ada, Max, Asystent)" },
  ]);
  const [onboardingInput, setOnboardingInput] = useState("");
  // UI state
  const [demoToast, setDemoToast] = useState(false);

  // Handlers
  const handleEscalation = (e: any) => {
    setEscalation(e.target.value);
    // TODO: zapisz do backendu
  };
  const handleAutonomy = (v: number) => {
    setAutonomy(v);
    // TODO: zapisz do backendu
  };
  const handleOnboardingSend = () => {
    if (!onboardingInput.trim()) return;
    setOnboardingHistory(h => [...h, { sender: "user", text: onboardingInput }]);
    setBotName(onboardingInput);
    setOnboardingInput("");
    // TODO: zapisz do backendu
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-gray-50 to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-violet-900">
      <div className="max-w-7xl mx-auto w-full px-6 py-10 flex flex-col gap-10">
        {/* Autonomy slider */}
        <section className="w-full bg-white dark:bg-gray-900/80 rounded-2xl p-6 shadow-lg mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-900 dark:text-white font-semibold">Tryb aktywności bota</span>
            <span className="text-violet-700 dark:text-violet-300 font-bold">{autonomy === 1 ? "Tylko drafty do akceptacji" : autonomy === 2 ? "Autonomia z alertami" : "Pełna autonomia"}</span>
          </div>
          <input type="range" min={1} max={3} value={autonomy} onChange={e => handleAutonomy(Number(e.target.value))} className="w-full accent-violet-500" />
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-400 mt-2">
            <span>Tylko drafty do akceptacji</span>
            <span>Autonomia z alertami</span>
            <span>Pełna autonomia</span>
          </div>
        </section>
        {/* Reguły eskalacji + onboarding/chat */}
        <section className="flex flex-col md:flex-row gap-8 w-full">
          <div className="flex-1 bg-white dark:bg-gray-900/80 rounded-2xl p-6 shadow-lg">
            <h2 className="text-gray-900 dark:text-white font-semibold mb-4">Reguły eskalacji</h2>
            <textarea
              className="w-full min-h-[80px] rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-3 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Opisz, kiedy przekazać rozmowę do człowieka..."
              value={escalation}
              onChange={handleEscalation}
            />
          </div>
          <div className="flex-1 bg-white dark:bg-gray-900/80 rounded-2xl p-6 shadow-lg flex flex-col gap-4">
            <h2 className="text-gray-900 dark:text-white font-semibold mb-2">Personalizacja BOK – onboarding</h2>
            <div className="flex flex-col gap-2">
              {onboardingHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === "bot" ? "justify-start" : "justify-end"}`}>
                  <div className={`rounded-2xl px-5 py-3 max-w-[80%] text-base shadow-sm ${msg.sender === "bot" ? "bg-violet-100 dark:bg-violet-900 text-violet-900 dark:text-violet-100" : "bg-violet-500 text-white"}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={onboardingInput}
                onChange={e => setOnboardingInput(e.target.value)}
                placeholder="Napisz odpowiedź..."
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                onClick={handleOnboardingSend}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition"
              >
                Wyślij
              </button>
            </div>
          </div>
        </section>
        {/* Demo notification */}
        {demoToast && (
          <div className="fixed bottom-8 right-8 bg-violet-700 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 z-50">
            <CheckCircle className="w-5 h-5 text-green-300" />
            <span>To jest przykładowe powiadomienie demo. Zamknij</span>
            <button onClick={() => setDemoToast(false)} className="ml-4 text-white/70 hover:text-white">✕</button>
          </div>
        )}
        <button
          className="fixed bottom-8 left-8 bg-violet-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-violet-700"
          onClick={() => setDemoToast(true)}
        >
          Pokaż demo powiadomienie
        </button>
      </div>
    </div>
  );
} 