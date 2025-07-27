import React from "react";
import { BookOpen, MessageCircle, BarChart2, Plug, Settings2, Smile, Zap } from "lucide-react";

const steps = [
  {
    icon: <BookOpen className="w-8 h-8 text-violet-600" />, 
    title: "Dodawanie wiedzy i trening bota",
    desc: "W sekcji 'Baza wiedzy' możesz dodawać dokumenty, FAQ i tagować tematy. Im więcej wiedzy, tym lepiej bot odpowiada na pytania klientów. Testuj odpowiedzi w podglądzie rozmów!"
  },
  {
    icon: <MessageCircle className="w-8 h-8 text-violet-600" />,
    title: "Podgląd rozmów i przejmowanie chatu",
    desc: "Obserwuj na żywo rozmowy bota z klientami. Możesz w każdej chwili przejąć rozmowę lub zatwierdzić draft odpowiedzi. To świetny sposób na naukę i kontrolę jakości."
  },
  {
    icon: <Settings2 className="w-8 h-8 text-violet-600" />,
    title: "Personalizacja i ustawienia",
    desc: "Nadaj botowi imię, wybierz styl komunikacji, ustaw reguły rabatów i rekompensat. Dzięki temu bot będzie pasował do Twojej marki i potrzeb klientów."
  },
  {
    icon: <Plug className="w-8 h-8 text-violet-600" />,
    title: "Integracje z kanałami sprzedaży",
    desc: "Połącz bota z Allegro, Facebookiem, OLX, Amazonem i innymi platformami. Dzięki temu obsłużysz klientów z wielu miejsc w jednym panelu."
  },
  {
    icon: <BarChart2 className="w-8 h-8 text-violet-600" />,
    title: "Analityka i AI Insights",
    desc: "Śledź statystyki, satysfakcję klientów, czas odpowiedzi i trendy. AI Insights podpowie, jak jeszcze lepiej wykorzystać bota i gdzie są szanse na rozwój."
  },
  {
    icon: <Zap className="w-8 h-8 text-violet-600" />,
    title: "Tryb demo i szybki start",
    desc: "Wypróbuj tryb demo, aby zobaczyć jak bot działa w praktyce. To bezpieczne środowisko do nauki i testów – nie musisz się niczego obawiać!"
  },
  {
    icon: <Smile className="w-8 h-8 text-violet-600" />,
    title: "Porady i wsparcie",
    desc: "Jeśli masz pytania, skorzystaj z podpowiedzi w panelu lub napisz do naszego wsparcia. Bot uczy się razem z Tobą – im więcej testujesz, tym lepszy się staje!"
  },
];

export default function OnboardingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-[#23244a] p-0">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Onboarding – jak korzystać z BOK?</h1>
      <div className="max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {steps.map((step, i) => (
          <div key={i} className="bg-white dark:bg-white/10 rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 p-6 flex flex-col items-start gap-3">
            {step.icon}
            <div className="font-bold text-lg text-gray-800 dark:text-white mb-1">{step.title}</div>
            <div className="text-gray-600 dark:text-gray-200 text-base">{step.desc}</div>
          </div>
        ))}
      </div>
      <div className="text-gray-500 dark:text-gray-300 text-center text-base max-w-2xl">
        <b>Wskazówka:</b> Najlepsze efekty osiągniesz, jeśli regularnie testujesz bota, analizujesz statystyki i aktualizujesz bazę wiedzy. BOK jest Twoim asystentem – im więcej z nim pracujesz, tym lepiej rozumie Twoich klientów!
      </div>
    </div>
  );
} 