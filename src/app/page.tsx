"use client";
import { useState } from "react";
import { Bot, BarChart2, Smile, Timer, Zap } from "lucide-react";
import { mockMetrics, mockConversations } from "@/lib/mockData";
import { motion } from "framer-motion";
import Skeleton from "@/components/Skeleton";
import ActivityChart from "@/components/ActivityChart";

const iconMap = { Zap, Timer, Smile, BarChart2 };

export default function Dashboard() {
  const [botOnline, setBotOnline] = useState(true);
  const [loading, setLoading] = useState(false); // zawsze false, by pokazać dane demo
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-6">
        {mockMetrics.map((m, i) => {
          const Icon = iconMap[m.icon as keyof typeof iconMap];
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex-1 bg-gray-50 dark:bg-white/5 rounded-2xl p-6 flex items-center gap-4 shadow-lg border border-gray-200 dark:border-white/10 min-w-[180px]"
            >
              <div>{Icon && <Icon className="w-7 h-7 text-violet-600 dark:text-violet-400" />}</div>
              <div>
                <div className="text-base font-semibold text-gray-700 dark:text-white/80">{m.label}</div>
                <div className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{m.value}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="col-span-2 bg-gray-50 dark:bg-white/5 rounded-2xl p-6 shadow-lg min-h-[320px] border border-gray-200 dark:border-white/10 flex flex-col">
          <div className="font-semibold text-gray-700 dark:text-white/80 mb-4">Aktywność bota</div>
          <ActivityChart />
        </div>
        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-white/10 flex flex-col min-h-[320px]">
          <div className="font-semibold text-gray-700 dark:text-white/80 mb-2">Ostatnie rozmowy</div>
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
            {mockConversations.map((conv, i) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                className="bg-white dark:bg-white/10 rounded-lg px-3 py-2 flex flex-col gap-1 border border-gray-200 dark:border-white/10"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-gray-900 dark:text-white">{conv.customer}</span>
                  <span className="text-xs text-gray-500 dark:text-white/60">{conv.platform}</span>
                  <span className="ml-auto text-xs text-gray-400 dark:text-white/40">{conv.time}</span>
                </div>
                <div className="text-gray-700 dark:text-white/70 text-sm truncate">{conv.messages[0].text}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
