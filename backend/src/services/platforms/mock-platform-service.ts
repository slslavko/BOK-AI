import { EventEmitter } from 'events';
import { Logger } from 'pino';

export interface PlatformMessage {
  id: string;
  threadId: string;
  content: string;
  sender: 'customer' | 'bot';
  timestamp: Date;
  platform: 'allegro' | 'facebook' | 'olx' | 'messenger';
  customerId: string;
  customerName: string;
  metadata?: Record<string, any>;
}

export interface PlatformThread {
  id: string;
  tenantId: string;
  platform: 'allegro' | 'facebook' | 'olx' | 'messenger';
  customerId: string;
  customerName: string;
  status: 'active' | 'waiting' | 'escalated';
  lastActivity: Date;
  messages: PlatformMessage[];
  unreadCount: number;
  priority: 'low' | 'medium' | 'high';
}

// Mock Platform Service - symuluje real-time wiadomości z platform
export class MockPlatformService extends EventEmitter {
  private logger: Logger;
  private activeThreads: Map<string, PlatformThread> = new Map();
  private simulationInterval?: NodeJS.Timeout;

  // Realistic Polish customer messages
  private customerMessages = [
    "Dzień dobry, czy produkt jest dostępny?",
    "Kiedy będzie wysyłka?",
    "Czy mogę zmienić adres dostawy?",
    "Produkt nie działa, co robić?",
    "Ile kosztuje dostawa?",
    "Czy macie to w innym kolorze?",
    "Można zapłacić przy odbiorze?",
    "Jak długo trwa dostawa?",
    "Czy można zwrócić produkt?",
    "Nie otrzymałem jeszcze paczki",
    "Chciałbym anulować zamówienie",
    "Czy macie promocje?",
    "Produkt ma wadę, co dalej?",
    "Kiedy będzie ponownie dostępny?",
    "Czy mogę odebrać osobiście?",
    "Jaka jest gwarancja?",
    "Czy wysyłacie za granicę?",
    "Mam problem z logowaniem",
    "Nie mogę złożyć zamówienia",
    "Chcę zmienić zamówienie"
  ];

  private customerNames = [
    "Anna Kowalska", "Piotr Nowak", "Maria Wiśniewska", "Jan Kowalczyk",
    "Katarzyna Wójcik", "Tomasz Kamiński", "Agnieszka Lewandowska", "Marcin Zieliński",
    "Magdalena Szymańska", "Paweł Woźniak", "Joanna Dąbrowska", "Michał Kozłowski",
    "Ewa Jankowska", "Robert Mazur", "Monika Kwiatkowska", "Krzysztof Krawczyk",
    "Barbara Piotrowska", "Grzegorz Grabowski", "Dorota Nowakowska", "Marek Pawłowski"
  ];

  private platforms: Array<'allegro' | 'facebook' | 'olx' | 'messenger'> = [
    'allegro', 'facebook', 'olx', 'messenger'
  ];

  constructor(logger: Logger) {
    super();
    this.logger = logger;
    this.startRealtimeSimulation();
    this.logger.info('Mock Platform Service initialized with real-time simulation');
  }

  // Start symulacji real-time wiadomości
  private startRealtimeSimulation(): void {
    // Co 30-120 sekund generuj nową wiadomość
    this.simulationInterval = setInterval(() => {
      this.generateRealisticMessage();
    }, 30000 + Math.random() * 90000); // 30-120s
  }

  // Generuj realistyczną wiadomość od klienta
  private generateRealisticMessage(): void {
    const tenantIds = Array.from(new Set(
      Array.from(this.activeThreads.values()).map(t => t.tenantId)
    ));

    if (tenantIds.length === 0) return;

    const tenantId = tenantIds[Math.floor(Math.random() * tenantIds.length)];
    const existingThreads = Array.from(this.activeThreads.values())
      .filter(t => t.tenantId === tenantId);

    let thread: PlatformThread;

    // 70% szans na wiadomość w istniejącym wątku, 30% na nowy wątek
    if (existingThreads.length > 0 && Math.random() > 0.3) {
      // Wybierz istniejący wątek
      thread = existingThreads[Math.floor(Math.random() * existingThreads.length)];
    } else {
      // Stwórz nowy wątek
      thread = this.createNewThread(tenantId);
    }

    // Generuj wiadomość
    const message: PlatformMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      threadId: thread.id,
      content: this.customerMessages[Math.floor(Math.random() * this.customerMessages.length)],
      sender: 'customer',
      timestamp: new Date(),
      platform: thread.platform,
      customerId: thread.customerId,
      customerName: thread.customerName,
      metadata: {
        isSimulated: true,
        urgency: Math.random() > 0.8 ? 'high' : 'normal'
      }
    };

    // Dodaj do wątku
    thread.messages.push(message);
    thread.lastActivity = new Date();
    thread.unreadCount++;
    
    // Określ status wątku
    thread.status = this.determineThreadStatus(thread.messages);
    thread.priority = message.metadata?.urgency === 'high' ? 'high' : 
                     thread.messages.length > 5 ? 'medium' : 'low';

    // Zapisz wątek
    this.activeThreads.set(thread.id, thread);

    // Emit event
    this.emit('new_message', {
      tenantId,
      threadId: thread.id,
      message,
      thread: {
        id: thread.id,
        platform: thread.platform,
        customerName: thread.customerName,
        status: thread.status,
        unreadCount: thread.unreadCount,
        priority: thread.priority
      }
    });

    this.logger.debug({
      tenantId,
      threadId: thread.id,
      platform: thread.platform,
      customerName: thread.customerName,
      messageContent: message.content.substring(0, 50)
    }, 'Generated realistic customer message');
  }

  // Stwórz nowy wątek
  private createNewThread(tenantId: string): PlatformThread {
    const platform = this.platforms[Math.floor(Math.random() * this.platforms.length)];
    const customerName = this.customerNames[Math.floor(Math.random() * this.customerNames.length)];
    const customerId = `customer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const thread: PlatformThread = {
      id: `thread_${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      platform,
      customerId,
      customerName,
      status: 'active',
      lastActivity: new Date(),
      messages: [],
      unreadCount: 0,
      priority: 'low'
    };

    return thread;
  }

  // Get active threads for tenant
  async getActiveThreads(tenantId: string): Promise<PlatformThread[]> {
    const threads = Array.from(this.activeThreads.values())
      .filter(thread => thread.tenantId === tenantId)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

    return threads.map(thread => ({
      ...thread,
      messages: thread.messages.slice(-5) // Return only last 5 messages for performance
    }));
  }

  // Send message to thread (bot response)
  async sendMessage(
    threadId: string, 
    content: string, 
    tenantId: string
  ): Promise<{ success: boolean; messageId: string }> {
    const thread = this.activeThreads.get(threadId);
    
    if (!thread || thread.tenantId !== tenantId) {
      throw new Error('Thread not found or access denied');
    }

    const botMessage: PlatformMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      threadId,
      content,
      sender: 'bot',
      timestamp: new Date(),
      platform: thread.platform,
      customerId: thread.customerId,
      customerName: thread.customerName,
      metadata: {
        isBot: true,
        sentViaAPI: true
      }
    };

    // Add to thread
    thread.messages.push(botMessage);
    thread.lastActivity = new Date();
    thread.unreadCount = 0; // Reset unread count when bot responds
    thread.status = 'active';

    // Save thread
    this.activeThreads.set(threadId, thread);

    // Emit event
    this.emit('message_sent', {
      tenantId,
      threadId,
      message: botMessage
    });

    this.logger.info({
      tenantId,
      threadId,
      platform: thread.platform,
      messageLength: content.length
    }, 'Bot message sent to platform thread');

    // 60% szans na odpowiedź klienta w ciągu 10-60 sekund
    if (Math.random() > 0.4) {
      setTimeout(() => {
        this.simulateCustomerResponse(threadId);
      }, 10000 + Math.random() * 50000); // 10-60s
    }

    return {
      success: true,
      messageId: botMessage.id
    };
  }

  // Symuluj odpowiedź klienta na wiadomość bota
  private simulateCustomerResponse(threadId: string): void {
    const thread = this.activeThreads.get(threadId);
    if (!thread) return;

    const lastBotMessage = thread.messages
      .slice()
      .reverse()
      .find(m => m.sender === 'bot');

    if (!lastBotMessage) return;

    // Generuj kontekstualną odpowiedź
    const response = this.generateContextualResponse(lastBotMessage.content);

    const customerMessage: PlatformMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      threadId,
      content: response,
      sender: 'customer',
      timestamp: new Date(),
      platform: thread.platform,
      customerId: thread.customerId,
      customerName: thread.customerName,
      metadata: {
        isSimulated: true,
        isResponse: true,
        respondingTo: lastBotMessage.id
      }
    };

    thread.messages.push(customerMessage);
    thread.lastActivity = new Date();
    thread.unreadCount++;
    thread.status = this.determineThreadStatus(thread.messages);

    this.activeThreads.set(threadId, thread);

    this.emit('new_message', {
      tenantId: thread.tenantId,
      threadId,
      message: customerMessage,
      thread: {
        id: thread.id,
        platform: thread.platform,
        customerName: thread.customerName,
        status: thread.status,
        unreadCount: thread.unreadCount,
        priority: thread.priority
      }
    });

    this.logger.debug({
      threadId,
      platform: thread.platform,
      response: response.substring(0, 50)
    }, 'Generated contextual customer response');
  }

  // Generuj kontekstualną odpowiedź na wiadomość bota
  private generateContextualResponse(botMessage: string): string {
    const responses = {
      // Responses to common bot messages
      dostawa: [
        "Okej, dzięki za info",
        "A można szybciej?",
        "To długo, ale ok",
        "Dzięki, czekam"
      ],
      koszt: [
        "Drogo...",
        "Ok, akceptuję",
        "Można taniej?",
        "Dzięki za wycenę"
      ],
      produkt: [
        "Super, dziękuję",
        "A w innych kolorach?",
        "Czy to oryginał?",
        "Dzięki za informacje"
      ],
      zwrot: [
        "Jak długo to trwa?",
        "Okej, jak to zrobić?",
        "Dzięki, zrozumiałem",
        "A kto płaci za zwrot?"
      ],
      default: [
        "Dzięki",
        "Ok, rozumiem",
        "Super, dziękuję za pomoc",
        "Okej",
        "Dzięki za szybką odpowiedź",
        "👍",
        "Ok, dzięki",
        "Rozumiem, dzięki"
      ]
    };

    const botLower = botMessage.toLowerCase();
    
    let responseCategory = 'default';
    if (botLower.includes('dostaw') || botLower.includes('wysyłk')) {
      responseCategory = 'dostawa';
    } else if (botLower.includes('koszt') || botLower.includes('cena') || botLower.includes('złot')) {
      responseCategory = 'koszt';
    } else if (botLower.includes('produkt') || botLower.includes('towar') || botLower.includes('specyfik')) {
      responseCategory = 'produkt';
    } else if (botLower.includes('zwrot') || botLower.includes('reklamacj') || botLower.includes('wymian')) {
      responseCategory = 'zwrot';
    }

    const categoryResponses = responses[responseCategory as keyof typeof responses] || responses.default;
    return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  }

  // Określ status wątku na podstawie wiadomości
  private determineThreadStatus(messages: PlatformMessage[]): 'active' | 'waiting' | 'escalated' {
    if (messages.length === 0) return 'active';

    const lastMessage = messages[messages.length - 1];
    const timeSinceLastMessage = Date.now() - lastMessage.timestamp.getTime();
    
    // Escalated if customer sent multiple messages without bot response
    const recentCustomerMessages = messages
      .slice(-5)
      .filter(m => m.sender === 'customer').length;
    
    if (recentCustomerMessages >= 3) {
      return 'escalated';
    }

    // Waiting if last message was from customer and it's been > 5 minutes
    if (lastMessage.sender === 'customer' && timeSinceLastMessage > 5 * 60 * 1000) {
      return 'waiting';
    }

    return 'active';
  }

  // Generate initial demo threads for new tenant
  async generateInitialDemoThreads(tenantId: string, count: number = 5): Promise<void> {
    for (let i = 0; i < count; i++) {
      const thread = this.createNewThread(tenantId);
      
      // Add 1-3 initial messages per thread
      const messageCount = 1 + Math.floor(Math.random() * 3);
      
      for (let j = 0; j < messageCount; j++) {
        const isCustomerMessage = j === 0 || Math.random() > 0.6;
        
        const message: PlatformMessage = {
          id: `msg_${Date.now()}_${i}_${j}_${Math.random().toString(36).substr(2, 9)}`,
          threadId: thread.id,
          content: isCustomerMessage 
            ? this.customerMessages[Math.floor(Math.random() * this.customerMessages.length)]
            : "Dzień dobry! Jak mogę Panu/Pani pomóc?",
          sender: isCustomerMessage ? 'customer' : 'bot',
          timestamp: new Date(Date.now() - (messageCount - j) * 60000), // Messages 1 minute apart
          platform: thread.platform,
          customerId: thread.customerId,
          customerName: thread.customerName,
          metadata: {
            isDemo: true,
            isInitial: true
          }
        };

        thread.messages.push(message);
      }

      // Set thread properties
      thread.lastActivity = thread.messages[thread.messages.length - 1].timestamp;
      thread.unreadCount = thread.messages.filter(m => m.sender === 'customer').length;
      thread.status = this.determineThreadStatus(thread.messages);
      thread.priority = Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low';

      // Save thread
      this.activeThreads.set(thread.id, thread);
    }

    this.logger.info({
      tenantId,
      threadsCreated: count
    }, 'Generated initial demo threads for tenant');
  }

  // Get thread by ID
  async getThread(threadId: string, tenantId: string): Promise<PlatformThread | null> {
    const thread = this.activeThreads.get(threadId);
    
    if (!thread || thread.tenantId !== tenantId) {
      return null;
    }

    return thread;
  }

  // Mark thread as read
  async markThreadAsRead(threadId: string, tenantId: string): Promise<boolean> {
    const thread = this.activeThreads.get(threadId);
    
    if (!thread || thread.tenantId !== tenantId) {
      return false;
    }

    thread.unreadCount = 0;
    this.activeThreads.set(threadId, thread);

    return true;
  }

  // Get statistics for tenant
  async getStatistics(tenantId: string): Promise<{
    totalThreads: number;
    activeThreads: number;
    waitingThreads: number;
    escalatedThreads: number;
    totalMessages: number;
    averageResponseTime: number;
    platformBreakdown: Record<string, number>;
  }> {
    const threads = Array.from(this.activeThreads.values())
      .filter(thread => thread.tenantId === tenantId);

    const stats = {
      totalThreads: threads.length,
      activeThreads: threads.filter(t => t.status === 'active').length,
      waitingThreads: threads.filter(t => t.status === 'waiting').length,
      escalatedThreads: threads.filter(t => t.status === 'escalated').length,
      totalMessages: threads.reduce((sum, t) => sum + t.messages.length, 0),
      averageResponseTime: 0, // Would calculate from actual response times
      platformBreakdown: threads.reduce((acc, thread) => {
        acc[thread.platform] = (acc[thread.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return stats;
  }

  // Cleanup old threads (call periodically)
  cleanup(): void {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    let removedCount = 0;
    for (const [threadId, thread] of this.activeThreads.entries()) {
      if (thread.lastActivity < oneWeekAgo) {
        this.activeThreads.delete(threadId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.info({ removedCount }, 'Cleaned up old threads');
    }
  }

  // Stop simulation
  stop(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = undefined;
    }
    this.removeAllListeners();
    this.logger.info('Mock Platform Service stopped');
  }
} 