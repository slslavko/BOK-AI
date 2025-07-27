"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageCircle,
  BookOpen,
  Settings2,
  BarChart2,
  Bot,
  Plug
} from "lucide-react";
import Image from "next/image";

const navItems = [
  { href: "/", label: "Panel główny", icon: LayoutDashboard },
  { href: "/chat", label: "Podgląd rozmów", icon: MessageCircle },
  { href: "/knowledge", label: "Baza wiedzy", icon: BookOpen },
  { href: "/settings", label: "Ustawienia bota", icon: Settings2 },
  { href: "/analytics", label: "Analityka", icon: BarChart2 },
  { href: "/integrations", label: "Integracje", icon: Plug },
  { href: "/demo", label: "Tryb demo", icon: Bot },
  { href: "/onboarding", label: "Onboarding", icon: BookOpen },
  { href: "/analytics/insights", label: "AI Insights", icon: BarChart2 },
];

const HASLA = [
  "Urlop? Nie znam.",
  "Chory? Niemożliwe.",
  "Zły dzień? Nie w moim przypadku.",
  "3 sekundy. Każda odpowiedź."
];

export default function SidebarNav() {
  const pathname = usePathname();
  const [hasloIdx, setHasloIdx] = useState(0);
  const [botOnline, setBotOnline] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => {
      setHasloIdx(idx => (idx + 1) % HASLA.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);
  return (
    <aside className="hidden md:flex flex-col w-20 xl:w-64 bg-white dark:bg-white/5 border-r border-gray-200 dark:border-white/10 shadow-lg py-6 gap-4">
      <div className="flex flex-col items-center xl:items-start gap-8 px-2 xl:px-6">
        <div className="flex flex-col items-center justify-center mb-8 w-full gap-2">
          <div className="flex items-center justify-center w-full">
            <div className="bg-white rounded-full shadow-md flex items-center justify-center overflow-hidden" style={{ width: 144, height: 144 }}>
              <Image src="/rashid-logo.png" alt="Rashid BOK" width={132} height={132} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
            </div>
          </div>
          {/* Usunięto status online/offline */}
          <div className="hidden xl:block min-h-[32px] w-full text-center transition-opacity duration-500 text-violet-700 dark:text-violet-200 font-semibold text-lg mt-2" key={hasloIdx}>
            {HASLA[hasloIdx]}
          </div>
        </div>
        <nav className="flex flex-col gap-2 w-full">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition font-medium text-gray-800 dark:text-white/80 hover:bg-violet-100 dark:hover:bg-violet-500/10 hover:text-violet-700 dark:hover:text-violet-300 ${pathname === href ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-200" : ""}`}
            >
              <Icon className="w-5 h-5 text-violet-600 dark:text-violet-300" />
              <span className="hidden xl:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-1" />
    </aside>
  );
} 