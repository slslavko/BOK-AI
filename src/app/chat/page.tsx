"use client";
import { useState, useEffect, useRef } from "react";
import { Bot, User, Send, Paperclip } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useDemoToast } from "@/components/Toaster";
import AdvancedFilters from "@/components/AdvancedFilters";
import DataExport from "@/components/DataExport";
import apiClient from "@/lib/api-client";

const platforms = ["Wszystkie", "Allegro", "Facebook", "OLX", "Messenger"];

interface Thread {
  id: string;
  platform: string;
  customerName: string;
  status: 'active' | 'waiting' | 'answered' | 'viewed';
  unreadCount: number;
  lastActivity: string;
  lastMessagePreview?: string;
  messages: Array<{
    id: string;
    content: string;
    sender: 'customer' | 'bot';
    timestamp: string;
  }>;
}

export default function ChatMonitor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [platform, setPlatform] = useState("Wszystkie");
  const [status, setStatus] = useState("Wszystkie");
  const [search, setSearch] = useState("");
  
  // Notifications
  const [notifications, setNotifications] = useState({
    newMessages: 0,
    newThreads: 0,
    unansweredThreads: 0,
    total: 0
  });
  const [newThreadIds, setNewThreadIds] = useState<string[]>([]);
  const [unansweredThreadIds, setUnansweredThreadIds] = useState<string[]>([]);
  const [lastChecked, setLastChecked] = useState<string>('');
  
  // Pagination
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [allThreads, setAllThreads] = useState<Thread[]>([]);
  
  const showToast = useDemoToast();

  // Obsługa parametru thread z URL
  useEffect(() => {
    const threadParam = searchParams.get('thread');
    if (threadParam && threadParam !== selectedThreadId) {
      setSelectedThreadId(threadParam);
    } else if (!threadParam && selectedThreadId) {
      // Wyczyść wybraną rozmowę gdy nie ma parametru thread
      setSelectedThreadId(null);
    }
  }, [searchParams, selectedThreadId]);

  // Load threads from API (tylko przy zmianie filtrów backend)
  useEffect(() => {
    loadThreads();
  }, [dateFrom, dateTo, platform, status]);

  // Load detailed messages when thread is selected
  useEffect(() => {
    if (selectedThreadId) {
      loadThreadMessages(selectedThreadId);
    }
  }, [selectedThreadId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [threads, selectedThreadId]);

  // Automatyczne odświeżanie wiadomości co 5 sekund
  useEffect(() => {
    if (!selectedThreadId) return;
    
    const interval = setInterval(() => {
      loadThreadMessages(selectedThreadId);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [selectedThreadId]);

  // Sprawdzanie nowych powiadomień co 10 sekund
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        // Dodaj timestamp żeby wymusić odświeżenie
        const response = await apiClient.getNotifications();
        setNotifications({
          ...response.notifications,
          unansweredThreads: response.notifications.unansweredThreads || 0
        });
        setNewThreadIds(response.newThreadIds);
        setUnansweredThreadIds(response.unansweredThreadIds || []);
        setLastChecked(response.lastChecked);
        
        // Jeśli są nowe rozmowy, dodaj je do listy bez pełnego przeładowania
        if (response.newThreadIds.length > 0) {
          // Tylko dodaj nowe wątki, nie przeładowuj całej listy
          console.log('New threads detected:', response.newThreadIds);
        }
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

  const loadThreads = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
        setAllThreads([]);
      } else {
        setLoadingMore(true);
      }
      
      const response = await apiClient.getThreads(dateFrom, dateTo, platform, status);
      const newThreads = response.threads;
      
      // Check if not connected to Allegro
      if (response.notConnected) {
        console.log('Not connected to Allegro - please reconnect');
        // You can show a notification here to reconnect
        return;
      }
      
      if (reset) {
        setThreads(newThreads);
        setAllThreads(newThreads);
        
        // Select first thread if none selected and load its messages
        if (!selectedThreadId && newThreads.length > 0) {
          const firstThreadId = newThreads[0].id;
          setSelectedThreadId(firstThreadId);
          // Load messages for the first thread
          await loadThreadMessages(firstThreadId);
        }
      } else {
        // Avoid duplicates by checking if thread already exists
        setAllThreads(prev => {
          const existingIds = new Set(prev.map((t: Thread) => t.id));
          const uniqueNewThreads = newThreads.filter((t: any) => !existingIds.has(t.id));
          return [...prev, ...uniqueNewThreads];
        });
        setThreads(prev => {
          const existingIds = new Set(prev.map((t: Thread) => t.id));
          const uniqueNewThreads = newThreads.filter((t: any) => !existingIds.has(t.id));
          return [...prev, ...uniqueNewThreads];
        });
      }
      
      // Zachowaj hasMore tylko jeśli to nie jest reset (zmiana filtrów)
      if (!reset) {
        setHasMore(newThreads.length === 20); // Assuming 20 is the limit
      } else {
        // Przy resecie (zmiana filtrów) zawsze pokazuj przycisk "Załaduj więcej"
        setHasMore(true);
      }
    } catch (error) {
      console.error('Failed to load threads:', error);
      showToast();
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreThreads = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const newOffset = offset + 20;
      setOffset(newOffset);
      
      // Użyj tej samej funkcji co loadThreads, ale z offset
      const response = await apiClient.getThreads(dateFrom, dateTo, platform, status, 20, newOffset);
      const newThreads = response.threads;
      
      // Avoid duplicates by checking if thread already exists
      setAllThreads(prev => {
        const existingIds = new Set(prev.map((t: Thread) => t.id));
        const uniqueNewThreads = newThreads.filter((t: any) => !existingIds.has(t.id));
        return [...prev, ...uniqueNewThreads];
      });
      setThreads(prev => {
        const existingIds = new Set(prev.map((t: Thread) => t.id));
        const uniqueNewThreads = newThreads.filter((t: any) => !existingIds.has(t.id));
        return [...prev, ...uniqueNewThreads];
      });
      
      setHasMore(newThreads.length === 20); // Assuming 20 is the limit
    } catch (error) {
      console.error('Failed to load more threads:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const load100Threads = async () => {
    if (loadingMore) return;
    
    try {
      setLoadingMore(true);
      setOffset(0);
      setAllThreads([]);
      setThreads([]);
      
      // Załaduj 5 stron po 20 rozmów każda (100 rozmów)
      const allThreads = [];
      for (let i = 0; i < 5; i++) {
        const response = await apiClient.getThreads(dateFrom, dateTo, platform, status, 20, i * 20);
        const newThreads = response.threads;
        
        // Avoid duplicates
        const existingIds = new Set(allThreads.map((t: Thread) => t.id));
        const uniqueNewThreads = newThreads.filter((t: any) => !existingIds.has(t.id));
        allThreads.push(...uniqueNewThreads);
        
        // Jeśli nie ma więcej rozmów, przerwij
        if (newThreads.length < 20) break;
      }
      
      setAllThreads(allThreads);
      setThreads(allThreads);
      // Sprawdź czy może być więcej rozmów (jeśli załadowaliśmy pełne 5 stron)
      setHasMore(allThreads.length === 100);
      
      // Select first thread if none selected
      if (!selectedThreadId && allThreads.length > 0) {
        const firstThreadId = allThreads[0].id;
        setSelectedThreadId(firstThreadId);
        await loadThreadMessages(firstThreadId);
      }
    } catch (error) {
      console.error('Failed to load 100 threads:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    try {
      const response = await apiClient.getThreadMessages(threadId);
      if (response.messages && response.messages.length > 0) {
        // Update the selected thread with detailed messages
        setThreads(prevThreads => 
          prevThreads.map(thread => 
            thread.id === threadId 
              ? { 
                  ...thread, 
                  messages: response.messages,
                  // Update status based on last message, but preserve 'answered' status
                  status: thread.status === 'answered' ? 'answered' : (response.threadStatus || 'active'),
                  // Reset unread count when messages are loaded
                  unreadCount: 0
                }
              : thread
          )
        );
      }
      
      // ZAWSZE oznacz jako przeczytane w Allegro gdy wyświetlamy rozmowę
      try {
        await apiClient.markThreadAsRead(threadId);
        console.log(`Marked thread ${threadId} as read in Allegro`);
        
        // Zresetuj unreadCount dla tej rozmowy w naszym stanie
        setThreads(prevThreads => 
          prevThreads.map(thread => 
            thread.id === threadId 
              ? { ...thread, unreadCount: 0 }
              : thread
          )
        );
      } catch (error) {
        console.error('Failed to mark as read in Allegro:', error);
      }
      
      // Po prostu usuń z newThreadIds po załadowaniu wiadomości
      if (newThreadIds.includes(threadId)) {
        setNewThreadIds(prev => prev.filter(id => id !== threadId));
        
        // Zmień status na 'viewed' gdy tylko wyświetlasz wiadomość
        setThreads(prevThreads => 
          prevThreads.map(thread => 
            thread.id === threadId 
              ? { ...thread, status: 'viewed' }
              : thread
          )
        );
        
        // Odśwież powiadomienia po oznaczeniu jako przeczytane
        setTimeout(async () => {
          try {
            const response = await apiClient.getNotifications();
            setNotifications(response.notifications);
            setNewThreadIds(response.newThreadIds);
            setLastChecked(response.lastChecked);
          } catch (error) {
            console.error('Failed to refresh notifications:', error);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to load thread messages:', error);
    }
  };

  // Send message to thread
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThreadId || sending) return;

    try {
      setSending(true);
      await apiClient.sendThreadMessage(selectedThreadId, newMessage, attachments);
      setNewMessage("");
      setAttachments([]);
      
      // Remove the thread from newThreadIds since we just replied
      setNewThreadIds(prev => prev.filter(id => id !== selectedThreadId));
      
      // Update the selected thread status to 'answered' since we just replied
      setThreads(prevThreads => 
        prevThreads.map(thread => 
          thread.id === selectedThreadId 
            ? { ...thread, status: 'answered' }
            : thread
        )
      );
      
      // Reload detailed messages for the selected thread
      if (selectedThreadId) {
        await loadThreadMessages(selectedThreadId);
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      showToast();
    } finally {
      setSending(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const file = files[0];
      
      // Sprawdź rozmiar pliku
      if (file.size > 5 * 1024 * 1024) {
        alert('Plik jest za duży. Maksymalny rozmiar to 5MB.');
        return;
      }
      
      const attachmentId = await apiClient.uploadFile(file);
      setAttachments(prev => [...prev, attachmentId]);
      alert('Plik został dodany pomyślnie!');
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert(`Błąd podczas dodawania pliku: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Filter threads (tylko wyszukiwanie lokalnie, reszta w backend)
  const filteredThreads = threads.filter(thread => {
    // Tylko filtrowanie po wyszukiwaniu lokalnie
    if (search && !thread.customerName.toLowerCase().includes(search.toLowerCase()) && 
        !thread.messages.some(m => m.content.toLowerCase().includes(search.toLowerCase()))) {
      return false;
    }
    return true;
  });

  const selectedThread = threads.find(t => t.id === selectedThreadId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-white/60">Ładowanie rozmów...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 h-full min-h-[400px]">
      {/* Threads List */}
      <div className="w-full md:w-80 xl:w-96 bg-gray-50 dark:bg-white/5 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-white/10 flex flex-col">
        <div className="font-semibold text-gray-700 dark:text-white/80 mb-4">
          Aktywne rozmowy ({threads.length})
        </div>
        
        <AdvancedFilters
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFrom={setDateFrom}
          onDateTo={setDateTo}
          platform={platform}
          onPlatform={setPlatform}
          status={status}
          onStatus={setStatus}
          search={search}
          onSearch={setSearch}
        />
        
        <div className="flex gap-2 mb-2">
          {platforms.map((p) => (
            <button 
              key={p} 
              onClick={() => setPlatform(p)}
              className={`px-2 py-1 rounded text-xs transition ${
                platform === p 
                  ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300" 
                  : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/60 hover:bg-violet-100 dark:hover:bg-violet-500/20"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        
        <DataExport dateFrom={dateFrom} dateTo={dateTo} />
        
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[400px]">
          {filteredThreads.length > 0 ? (
            <>
              {filteredThreads.map((thread) => (
                <motion.button
                  key={thread.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={async () => {
                    setSelectedThreadId(thread.id);
                    router.push(`${pathname}?thread=${thread.id}`);
                  }}
                  className={`text-left px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 flex flex-col gap-1 transition ${
                    selectedThreadId === thread.id 
                      ? "bg-violet-100 dark:bg-violet-500/20 text-violet-900 dark:text-violet-200" 
                      : newThreadIds.includes(thread.id)
                      ? "bg-green-100 dark:bg-green-500/20 text-green-900 dark:text-green-200 border-green-300 dark:border-green-500"
                      : "bg-white dark:bg-white/10 text-gray-800 dark:text-white/80"
                  }`}
                >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold">{thread.customerName}</span>
                  <span className="text-xs text-gray-500 dark:text-white/60 capitalize">
                    {thread.platform}
                  </span>
                  {newThreadIds.includes(thread.id) && (
                    <span className="ml-auto bg-green-500 text-white text-xs rounded-full px-2 py-0.5 animate-pulse">
                      NOWA
                    </span>
                  )}
                  {thread.unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {thread.unreadCount}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    thread.status === 'active' ? 'bg-green-100 text-green-700' :
                    thread.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' :
                    thread.status === 'answered' ? 'bg-blue-100 text-blue-700' :
                    thread.status === 'viewed' ? 'bg-gray-100 text-gray-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {thread.status === 'active' ? 'Aktywna' :
                     thread.status === 'waiting' ? 'Oczekuje' :
                     thread.status === 'answered' ? 'Odpowiedziana' :
                     thread.status === 'viewed' ? 'Wyświetlona' :
                     thread.status}
                  </span>
                </div>
                <div className="text-gray-700 dark:text-white/70 text-sm truncate">
                  {thread.lastMessagePreview || (thread.messages && thread.messages.length > 0 ? thread.messages[thread.messages.length - 1]?.content : null) || 'Brak wiadomości'}
                </div>
                <div className="text-xs text-gray-400 dark:text-white/40">
                  {new Date(thread.lastActivity).toLocaleString('pl-PL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </motion.button>
            ))}
            
            {/* Load More Buttons */}
            <div className="mt-4 flex gap-2">
              {hasMore && (
                <button
                  onClick={loadMoreThreads}
                  disabled={loadingMore}
                  className="px-4 py-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/70 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      Ładowanie...
                    </>
                  ) : (
                    'Załaduj więcej rozmów'
                  )}
                </button>
              )}
              <button
                onClick={load100Threads}
                disabled={loadingMore}
                className="px-4 py-2 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                    Ładowanie...
                  </>
                ) : (
                  'Załaduj 100 rozmów'
                )}
              </button>
            </div>
            </>
          ) : (
            <div className="text-gray-400 dark:text-white/40 text-center py-8">
              Brak rozmów spełniających kryteria
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-white dark:bg-white/5 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-white/10 flex flex-col min-h-[400px]">
        <div className="font-semibold text-gray-700 dark:text-white/80 mb-4 flex items-center gap-2">
          {selectedThread ? (
            <>
              Rozmowa z {selectedThread.customerName}
              <span className="ml-auto flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-white/50">
                  Status: 
                  <span className={`font-bold ml-1 ${
                    selectedThread.status === 'active' ? 'text-green-600 dark:text-green-400' :
                    selectedThread.status === 'waiting' ? 'text-yellow-600 dark:text-yellow-400' :
                    selectedThread.status === 'answered' ? 'text-blue-600 dark:text-blue-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {selectedThread.status === 'active' ? 'Aktywna' :
                     selectedThread.status === 'waiting' ? 'Oczekuje' :
                     selectedThread.status === 'answered' ? 'Odpowiedziana' :
                     selectedThread.status === 'viewed' ? 'Wyświetlona' :
                     selectedThread.status}
                  </span>
                </span>
              </span>
            </>
          ) : (
            'Wybierz rozmowę'
          )}
        </div>

        {selectedThread ? (
          <>
            {/* Messages */}
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto mb-4 max-h-[400px] messages-container">
              {selectedThread.messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-start gap-2 ${msg.sender === "bot" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`rounded-full p-2 ${
                    msg.sender === "bot" 
                      ? "bg-violet-100 dark:bg-violet-500/30" 
                      : "bg-gray-100 dark:bg-white/10"
                  }`}>
                    {msg.sender === "bot" ? (
                      <Bot className="w-5 h-5 text-violet-600 dark:text-violet-300" />
                    ) : (
                      <User className="w-5 h-5 text-gray-500 dark:text-white/80" />
                    )}
                  </div>
                  <div className={`rounded-xl px-4 py-2 text-sm max-w-[70%] shadow ${
                    msg.sender === "bot" 
                      ? "bg-violet-50 dark:bg-violet-500/10 text-violet-900 dark:text-violet-100" 
                      : "bg-white dark:bg-white/10 text-gray-900 dark:text-white/90"
                  }`}>
                    <div>{msg.content}</div>
                    
                    {/* Wyświetl załączniki */}
                    {(msg as any).attachments && (msg as any).attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {(msg as any).attachments.map((attachment: any, index: number) => (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-white/20 rounded cursor-pointer hover:bg-white/30 transition-colors" 
                               onClick={() => {
                                 const url = `http://localhost:3001/api/attachments/${attachment.originalId || attachment.id}?tenantId=${localStorage.getItem('tenantId') || 'demo-tenant'}`;
                                 window.open(url, '_blank');
                               }}>
                            <Paperclip className="w-4 h-4" />
                            <span className="text-xs">
                              {attachment.filename || `Załącznik ${index + 1}`}
                            </span>
                            <span className="text-xs text-gray-400">(kliknij aby otworzyć)</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-white/40 mt-1">
                      <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        (msg as any).status === 'sent' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {(msg as any).status === 'sent' ? 'Wysłane' : 'Otrzymane'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Napisz odpowiedź..."
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white/90 placeholder-gray-500 dark:placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-violet-500"
                disabled={sending}
              />
              
              {/* File Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
                disabled={uploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-2 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/80 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Dodaj załącznik"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Wysyłanie...' : 'Wyślij'}
              </button>
            </div>
            
            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-white/5 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-white/60 mb-1">
                  Załączniki ({attachments.length}):
                </div>
                <div className="flex gap-2">
                  {attachments.map((id, index) => (
                    <span key={id} className="text-xs bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-1 rounded">
                      Plik {index + 1}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-4 flex gap-2">
              <button
                className="px-3 py-1 rounded bg-blue-600/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-500/40 transition"
                onClick={showToast}
              >
                Przejmij rozmowę
              </button>
              <button
                className="px-3 py-1 rounded bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/60 border border-gray-200 dark:border-white/20 text-xs font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition"
                onClick={() => loadThreads()}
              >
                Odśwież
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-white/40">
            Wybierz rozmowę z listy po lewej stronie
          </div>
        )}
      </div>
    </div>
  );
} 