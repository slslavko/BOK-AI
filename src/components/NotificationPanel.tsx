'use client';

import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";

interface Notifications {
  newMessages: number;
  newThreads: number;
  unansweredThreads: number;
  total: number;
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [botName, setBotName] = useState('BOK');
  const [notifications, setNotifications] = useState<Notifications>({
    newMessages: 0,
    newThreads: 0,
    unansweredThreads: 0,
    total: 0
  });
  const [newThreadIds, setNewThreadIds] = useState<string[]>([]);
  const [unansweredThreadIds, setUnansweredThreadIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBotName(localStorage.getItem('botName') || 'BOK');
    }
  }, []);

  // Sprawdzanie powiadomień co 10 sekund
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const response = await apiClient.getNotifications();
        setNotifications({
          ...response.notifications,
          unansweredThreads: response.notifications.unansweredThreads || 0
        });
        setNewThreadIds(response.newThreadIds || []);
        setUnansweredThreadIds(response.unansweredThreadIds || []);
      } catch (error) {
        console.error('Failed to check notifications:', error);
      }
    };

    // Sprawdź od razu
    checkNotifications();
    
    // Następnie co 10 sekund
    const interval = setInterval(checkNotifications, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const getNotificationText = () => {
    if (notifications.newThreads > 0 && notifications.unansweredThreads > 0) {
      return `${notifications.newThreads} nowa rozmowa, ${notifications.unansweredThreads} rozmów czeka na odpowiedź`;
    } else if (notifications.newThreads > 0) {
      return `${notifications.newThreads} nowa rozmowa`;
    } else if (notifications.unansweredThreads > 0) {
      return `${notifications.unansweredThreads} rozmów czeka na odpowiedź`;
    }
    return 'Brak nowych powiadomień';
  };

  const handleNotificationClick = (threadId: string) => {
    setOpen(false);
    // Przejdź do strony chat z wybranym ID rozmowy
    router.push(`/chat?thread=${threadId}`);
  };

  const handleNewThreadsClick = () => {
    if (newThreadIds.length > 0) {
      handleNotificationClick(newThreadIds[0]);
    }
  };

  const handleUnansweredThreadsClick = () => {
    if (unansweredThreadIds.length > 0) {
      handleNotificationClick(unansweredThreadIds[0]);
    }
  };

  return (
    <div className="fixed top-6 right-6 z-50">
      <button onClick={() => setOpen(!open)} className="relative bg-white/80 dark:bg-black/80 rounded-full p-3 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-black transition-colors">
        <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        {notifications.total > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 min-w-[20px] flex items-center justify-center">
            {notifications.total}
          </span>
        )}
      </button>
      {open && (
        <div className="mt-2 w-80 bg-white/90 dark:bg-black/90 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 animate-fade-in">
          <div className="font-bold mb-2">Powiadomienia</div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {getNotificationText()}
          </div>
          <ul className="space-y-2">
            {notifications.newThreads > 0 && (
              <li 
                className="bg-blue-100 dark:bg-blue-900 rounded-xl p-2 text-sm cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                onClick={handleNewThreadsClick}
              >
                🆕 {notifications.newThreads} nowa rozmowa oczekuje na odpowiedź
              </li>
            )}
            {notifications.unansweredThreads > 0 && (
              <li 
                className="bg-yellow-100 dark:bg-yellow-900 rounded-xl p-2 text-sm cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                onClick={handleUnansweredThreadsClick}
              >
                💬 {notifications.unansweredThreads} rozmów czeka na odpowiedź
              </li>
            )}
            {notifications.total === 0 && (
              <li className="bg-green-100 dark:bg-green-900 rounded-xl p-2 text-sm">
                ✅ Wszystkie systemy działają poprawnie
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
} 