'use client';
import React, { useState, useEffect, useRef } from "react";

const QUESTIONS = [
  {
    key: "botName",
    question: "Jak chcesz, żeby Twój BOK się nazywał? (np. Ada, Max, Asystent)"
  },
  {
    key: "needs",
    question: "Jakie są Twoje główne potrzeby względem BOK? (np. szybka obsługa, automatyzacja, wsparcie po godzinach)"
  },
  {
    key: "style",
    question: "Jaki styl komunikacji preferujesz? (np. formalny, przyjazny, ekspercki, żartobliwy)"
  },
  {
    key: "clients",
    question: "Jacy są Twoi klienci? (np. młodzi rodzice, firmy, seniorzy, hobbyści)"
  },
  {
    key: "topics",
    question: "Jakie tematy są najważniejsze dla Twojej firmy? (np. reklamacje, doradztwo, nowości, promocje)"
  },
  {
    key: "hours",
    question: "W jakich godzinach BOK powinien być najbardziej aktywny? (np. 8-16, 10-22, 24/7)"
  },
  {
    key: "language",
    question: "W jakim języku BOK powinien odpowiadać? (np. polski, angielski, polski + angielski)"
  },
  {
    key: "specialization",
    question: "W czym BOK powinien się specjalizować? (np. sprzedaż, obsługa klienta, doradztwo techniczne)"
  }
];

export default function PersonalizationChat() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    botName: '', needs: '', style: '', clients: '', topics: '', hours: '', language: '', specialization: ''
  });
  const [history, setHistory] = useState([
    { from: 'bot', text: 'Cześć! Zanim zaczniesz korzystać z BOK, chciałbym Cię lepiej poznać. Odpowiedz na kilka pytań, a dostosuję się do Twoich potrzeb.' },
    { from: 'bot', text: 'Jak chcesz, żeby Twój BOK się nazywał? (np. Ada, Max, Asystent)' }
  ]);
  const [input, setInput] = useState('');
  const [finished, setFinished] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    // Wczytaj z localStorage jeśli istnieje
    if (typeof window !== 'undefined') {
      const saved = {
        botName: localStorage.getItem('botName') || '',
        needs: localStorage.getItem('botNeeds') || '',
        style: localStorage.getItem('botStyle') || '',
        clients: localStorage.getItem('botClients') || '',
        topics: localStorage.getItem('botTopics') || '',
        hours: localStorage.getItem('botHours') || '',
        language: localStorage.getItem('botLanguage') || '',
        specialization: localStorage.getItem('botSpecialization') || '',
      };
      if (Object.values(saved).some(Boolean)) {
        setAnswers(saved);
        setFinished(true);
      }
    }
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    const currentKey = QUESTIONS[step]?.key;
    setHistory(h => [...h, { from: 'user', text: input }]);
    setAnswers(a => ({ ...a, [currentKey]: input }));
    setTimeout(() => {
      if (step < QUESTIONS.length - 1) {
        setHistory(h => [...h, { from: 'bot', text: QUESTIONS[step + 1].question }]);
        setStep(s => s + 1);
      } else {
        // Zakończ
        setFinished(true);
        // Zapisz do localStorage
        if (typeof window !== 'undefined') {
          Object.entries({ ...answers, [currentKey]: input }).forEach(([k, v]) => {
            localStorage.setItem('bot' + k.charAt(0).toUpperCase() + k.slice(1), v);
          });
        }
      }
      setInput('');
    }, 600);
  };

  const handleEdit = () => {
    setFinished(false);
    setStep(0);
    setHistory([
      { from: 'bot', text: 'Cześć! Zanim zaczniesz korzystać z BOK, chciałbym Cię lepiej poznać. Odpowiedz na kilka pytań, a dostosuję się do Twoich potrzeb.' },
      { from: 'bot', text: 'Jak chcesz, żeby Twój BOK się nazywał? (np. Ada, Max, Asystent)' }
    ]);
    setAnswers({ botName: '', needs: '', style: '', clients: '', topics: '', hours: '', language: '', specialization: '' });
    setInput('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 bg-white/90 dark:bg-[#23244a] rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 p-0 flex flex-col min-h-[520px]">
      <div className="px-8 pt-8 pb-4">
        <h2 className="font-bold text-2xl text-gray-900 dark:text-white mb-2">Personalizacja BOK – onboarding</h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm">Porozmawiaj z AI, aby Twój BOK był naprawdę Twój. Odpowiedzi zostaną zapamiętane i wykorzystane w działaniu asystenta.</p>
      </div>
      <div ref={chatRef} className="flex-1 overflow-y-auto px-8 pb-4 space-y-3">
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'bot' ? 'justify-start' : 'justify-end'}`}>
            <div className={`rounded-2xl px-5 py-3 max-w-[80%] text-base shadow-sm ${msg.from === 'bot' ? 'bg-violet-100 dark:bg-violet-900 text-violet-900 dark:text-violet-100' : 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100'}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      {!finished && (
        <form className="flex gap-3 px-8 pb-8" onSubmit={e => { e.preventDefault(); handleSend(); }}>
          <input
            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-base bg-white dark:bg-[#23244a] text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-400 outline-none"
            placeholder="Napisz odpowiedź..."
            value={input}
            onChange={e => setInput(e.target.value)}
            autoFocus
            disabled={finished}
            maxLength={100}
          />
          <button type="submit" className="bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:bg-violet-700 transition text-base" disabled={!input.trim()}>Wyślij</button>
        </form>
      )}
      {finished && (
        <div className="px-8 pb-8 flex flex-col gap-3">
          <div className="bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 rounded-xl px-5 py-3 text-base font-semibold shadow-sm">Dziękuję za rozmowę! Twój BOK został spersonalizowany.</div>
          <div className="text-gray-700 dark:text-gray-200 text-sm">
            <b>Imię BOK:</b> {answers.botName || localStorage.getItem('botName') || 'BOK'}<br/>
            <b>Potrzeby:</b> {answers.needs || localStorage.getItem('botNeeds') || '-'}<br/>
            <b>Styl:</b> {answers.style || localStorage.getItem('botStyle') || '-'}<br/>
            <b>Klienci:</b> {answers.clients || localStorage.getItem('botClients') || '-'}<br/>
            <b>Tematy:</b> {answers.topics || localStorage.getItem('botTopics') || '-'}<br/>
            <b>Godziny pracy:</b> {answers.hours || localStorage.getItem('botHours') || '-'}<br/>
            <b>Język:</b> {answers.language || localStorage.getItem('botLanguage') || '-'}<br/>
            <b>Specjalizacja:</b> {answers.specialization || localStorage.getItem('botSpecialization') || '-'}
          </div>
          <button onClick={handleEdit} className="bg-violet-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:bg-violet-700 transition w-fit mt-2">Edytuj odpowiedzi</button>
        </div>
      )}
    </div>
  );
} 