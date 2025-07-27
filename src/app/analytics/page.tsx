"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import DataExport from "@/components/DataExport";
import dynamic from "next/dynamic";
const AIInsights = dynamic(() => import("./insights/page"), { ssr: false });

const topQuestions = [
  "Jakie są warunki zwrotu?",
  "Czy produkt jest dostępny od ręki?",
  "Jaki jest czas realizacji zamówienia?",
  "Czy mogę zmienić adres dostawy?",
  "Jakie są opcje płatności?",
];

export default function Analytics() {
  const [orders, setOrders] = useState(1200);
  const [avgCost, setAvgCost] = useState(3.5); // zł/oszczędność na rozmowie
  const roi = Math.round(orders * avgCost);
  return (
    <div className="flex flex-col gap-8">
      <AnalyticsCharts />
      <DataExport />
      <AIInsights />
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/5 rounded-2xl p-6 shadow-lg border border-white/10 min-h-[120px] flex flex-col"
      >
        <div className="font-semibold text-white/80 mb-2">Top pytania/problemy</div>
        <ul className="flex flex-col gap-2">
          {topQuestions.map((q, i) => (
            <li key={i} className="text-white/80 text-sm flex items-center gap-2">
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-violet-500/20 text-violet-200 font-bold">{i+1}</span>
              {q}
            </li>
          ))}
        </ul>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white/5 rounded-2xl p-6 shadow-lg border border-white/10 min-h-[120px] flex flex-col gap-4"
      >
        <div className="font-semibold text-white/80 mb-2">Kalkulator ROI</div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <label className="flex items-center gap-2 text-white/70">
            Liczba obsłużonych zamówień:
            <input type="number" min={0} className="w-24 px-2 py-1 rounded bg-white/10 border border-white/10 text-white/80" value={orders} onChange={e => setOrders(Number(e.target.value))} />
          </label>
          <label className="flex items-center gap-2 text-white/70">
            Średnia oszczędność na rozmowie (zł):
            <input type="number" min={0} step={0.1} className="w-20 px-2 py-1 rounded bg-white/10 border border-white/10 text-white/80" value={avgCost} onChange={e => setAvgCost(Number(e.target.value))} />
          </label>
          <div className="ml-auto text-lg font-bold text-green-400">Oszczędności: {roi} zł</div>
        </div>
      </motion.div>
    </div>
  );
} 