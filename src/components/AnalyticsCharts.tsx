"use client";
import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from "recharts";
import { Calendar, Maximize2, X } from "lucide-react";

const volumeData = [
  { dzien: "Pon", rozmowy: 120 },
  { dzien: "Wt", rozmowy: 98 },
  { dzien: "Śr", rozmowy: 110 },
  { dzien: "Czw", rozmowy: 150 },
  { dzien: "Pt", rozmowy: 170 },
  { dzien: "Sob", rozmowy: 80 },
  { dzien: "Niedz", rozmowy: 60 },
];

const satisfactionData = [
  { dzien: "Pon", sat: 95 },
  { dzien: "Wt", sat: 97 },
  { dzien: "Śr", sat: 96 },
  { dzien: "Czw", sat: 98 },
  { dzien: "Pt", sat: 97 },
  { dzien: "Sob", sat: 94 },
  { dzien: "Niedz", sat: 93 },
];

const responseTimeData = [
  { dzien: "Pon", czas: 110 },
  { dzien: "Wt", czas: 105 },
  { dzien: "Śr", czas: 98 },
  { dzien: "Czw", czas: 120 },
  { dzien: "Pt", czas: 130 },
  { dzien: "Sob", czas: 140 },
  { dzien: "Niedz", czas: 150 },
];

const heatmapData = [
  { godzina: "8:00", aktywnosc: 2 },
  { godzina: "9:00", aktywnosc: 5 },
  { godzina: "10:00", aktywnosc: 8 },
  { godzina: "11:00", aktywnosc: 12 },
  { godzina: "12:00", aktywnosc: 18 },
  { godzina: "13:00", aktywnosc: 15 },
  { godzina: "14:00", aktywnosc: 10 },
  { godzina: "15:00", aktywnosc: 7 },
  { godzina: "16:00", aktywnosc: 4 },
];

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function ChartBox({ title, children, onExpand }: { title: string; children: React.ReactNode; onExpand?: () => void }) {
  return (
    <div className="bg-gray-50 dark:bg-white/10 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-white/10 min-h-[220px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-gray-700 dark:text-white/80">{title}</div>
        {onExpand && (
          <button onClick={onExpand} className="p-2 rounded hover:bg-violet-100 dark:hover:bg-violet-500/20 transition" title="Powiększ wykres">
            <Maximize2 className="w-5 h-5 text-violet-600 dark:text-violet-300" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export default function AnalyticsCharts() {
  // Modal state dla każdego wykresu
  const [modal, setModal] = useState<null | string>(null);

  // Date pickery (dla uproszczenia: tylko dla wolumenu, reszta domyślna)
  const [dateFrom, setDateFrom] = useState("2024-07-01");
  const [dateTo, setDateTo] = useState("2024-07-07");
  // Filtrowanie tylko dla przykładu (wolumen)
  const filteredVolume = volumeData;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
      {/* Wolumen rozmów */}
      <ChartBox title="Wolumen rozmów" onExpand={() => setModal("volume")}> 
        <div className="pt-2">
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={filteredVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
              <XAxis dataKey="dzien" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#23244a", border: "none", color: "#fff" }} />
              <Bar dataKey="rozmowy" fill="#6366f1">
                {filteredVolume.map((entry, index) => (
                  <Cell key={index} fill={"url(#volumeGradient)"} />
                ))}
              </Bar>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartBox>
      {/* Satysfakcja klientów */}
      <ChartBox title="Satysfakcja klientów" onExpand={() => setModal("satisfaction")}> 
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={satisfactionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
            <XAxis dataKey="dzien" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} domain={[90, 100]} />
            <Tooltip contentStyle={{ background: "#23244a", border: "none", color: "#fff" }} />
            <Line type="monotone" dataKey="sat" stroke="#34d399" strokeWidth={3} dot={{ r: 5, fill: "#34d399" }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartBox>
      {/* Czas odpowiedzi */}
      <ChartBox title="Czas odpowiedzi (s)" onExpand={() => setModal("response")}> 
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={responseTimeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
            <XAxis dataKey="dzien" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip contentStyle={{ background: "#23244a", border: "none", color: "#fff" }} />
            <Line type="monotone" dataKey="czas" stroke="#60a5fa" strokeWidth={3} dot={{ r: 5, fill: "#60a5fa" }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartBox>
      {/* Heatmapa aktywności */}
      <ChartBox title="Heatmapa aktywności" onExpand={() => setModal("heatmap")}> 
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={heatmapData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
            <XAxis dataKey="godzina" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#23244a", border: "none", color: "#fff" }} />
            <Bar dataKey="aktywnosc" fill="#818cf8">
              {heatmapData.map((entry, index) => (
                <Cell key={index} fill={"url(#heatmapGradient)"} />
              ))}
            </Bar>
            <defs>
              <linearGradient id="heatmapGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#312e81" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>

      {/* Modale powiększania wykresów */}
      {modal === "volume" && (
        <Modal onClose={() => setModal(null)} title="Wolumen rozmów">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-8 justify-center items-center w-full">
            <label className="flex items-center gap-2 text-neutral-600">
              <Calendar className="w-4 h-4" /> Od:
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-neutral-100 border border-neutral-300 rounded px-2 py-1" />
            </label>
            <label className="flex items-center gap-2 text-neutral-600">
              <Calendar className="w-4 h-4" /> Do:
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-neutral-100 border border-neutral-300 rounded px-2 py-1" />
            </label>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={filteredVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
              <XAxis dataKey="dzien" stroke="#6b7280" fontSize={16} />
              <YAxis stroke="#6b7280" fontSize={16} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#23244a", border: "none", color: "#fff" }} />
              <Bar dataKey="rozmowy" fill="#6366f1">
                {filteredVolume.map((entry, index) => (
                  <Cell key={index} fill={"url(#volumeGradient)"} />
                ))}
              </Bar>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </Modal>
      )}
      {modal === "satisfaction" && (
        <Modal onClose={() => setModal(null)} title="Satysfakcja klientów">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={satisfactionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
              <XAxis dataKey="dzien" stroke="#6b7280" fontSize={16} />
              <YAxis stroke="#6b7280" fontSize={16} domain={[90, 100]} />
              <Tooltip contentStyle={{ background: "#23244a", border: "none", color: "#fff" }} />
              <Line type="monotone" dataKey="sat" stroke="#34d399" strokeWidth={4} dot={{ r: 8, fill: "#34d399" }} />
            </LineChart>
          </ResponsiveContainer>
        </Modal>
      )}
      {modal === "response" && (
        <Modal onClose={() => setModal(null)} title="Czas odpowiedzi (s)">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
              <XAxis dataKey="dzien" stroke="#6b7280" fontSize={16} />
              <YAxis stroke="#6b7280" fontSize={16} />
              <Tooltip contentStyle={{ background: "#23244a", border: "none", color: "#fff" }} />
              <Line type="monotone" dataKey="czas" stroke="#60a5fa" strokeWidth={4} dot={{ r: 8, fill: "#60a5fa" }} />
            </LineChart>
          </ResponsiveContainer>
        </Modal>
      )}
      {modal === "heatmap" && (
        <Modal onClose={() => setModal(null)} title="Heatmapa aktywności">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={heatmapData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
              <XAxis dataKey="godzina" stroke="#6b7280" fontSize={16} />
              <YAxis stroke="#6b7280" fontSize={16} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#23244a", border: "none", color: "#fff" }} />
              <Bar dataKey="aktywnosc" fill="#818cf8">
                {heatmapData.map((entry, index) => (
                  <Cell key={index} fill={"url(#heatmapGradient)"} />
                ))}
              </Bar>
              <defs>
                <linearGradient id="heatmapGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#312e81" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </Modal>
      )}
    </div>
  );
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded hover:bg-violet-500/20 transition" title="Zamknij">
          <X className="w-6 h-6 text-violet-400" />
        </button>
        <h2 className="text-xl font-bold mb-6 text-center text-neutral-800">{title}</h2>
        {children}
      </div>
    </div>
  );
} 