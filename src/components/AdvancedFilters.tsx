'use client';

import React from "react";

export function KnowledgeFilters({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-4 items-center bg-gray-50 dark:bg-white/10 p-4 rounded-2xl shadow border border-gray-200 dark:border-white/10 mb-4">
      <div className="flex-1">
        <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-200">Szukaj w bazie wiedzy</label>
        <input
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-[#23244a] text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-400 outline-none"
          placeholder="Wpisz nazwę, tag lub kategorię..."
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

const platforms = ["Wszystkie", "Allegro", "Facebook", "OLX", "Messenger"];
const statuses = ["Wszystkie", "Aktywne", "Wyświetlona", "Odpowiedziane"];

export default function AdvancedFilters({
  dateFrom, dateTo, onDateFrom, onDateTo,
  platform, onPlatform,
  status, onStatus,
  search, onSearch
}: {
  dateFrom: string, dateTo: string, onDateFrom: (v: string) => void, onDateTo: (v: string) => void,
  platform: string, onPlatform: (v: string) => void,
  status: string, onStatus: (v: string) => void,
  search: string, onSearch: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-4 items-end bg-gray-50 dark:bg-white/10 p-4 rounded-2xl shadow border border-gray-200 dark:border-white/10 mb-4">
      <div>
        <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-200">Data od</label>
        <input type="date" value={dateFrom} onChange={e => onDateFrom(e.target.value)} className="rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-[#23244a] text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-400 outline-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-200">Data do</label>
        <input type="date" value={dateTo} onChange={e => onDateTo(e.target.value)} className="rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-[#23244a] text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-400 outline-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-200">Platforma</label>
        <select value={platform} onChange={e => onPlatform(e.target.value)} className="rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-[#23244a] text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-400 outline-none">
          {platforms.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-200">Status rozmowy</label>
        <select value={status} onChange={e => onStatus(e.target.value)} className="rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-[#23244a] text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-400 outline-none">
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-200">Szukaj</label>
        <input value={search} onChange={e => onSearch(e.target.value)} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-[#23244a] text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-400 outline-none" placeholder="Wpisz frazę..." />
      </div>
    </div>
  );
} 