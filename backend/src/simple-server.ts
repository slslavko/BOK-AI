import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

const logger = {
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    }
  }
};

const fastify: FastifyInstance = Fastify({ 
  logger,
  trustProxy: true,
  bodyLimit: 10 * 1024 * 1024 // 10MB limit
});

// Rejestruj parser dla binary data (pliki)
fastify.addContentTypeParser('image/png', { parseAs: 'buffer' }, (req, body, done) => {
  done(null, body);
});

fastify.addContentTypeParser('image/jpeg', { parseAs: 'buffer' }, (req, body, done) => {
  done(null, body);
});

fastify.addContentTypeParser('image/jpg', { parseAs: 'buffer' }, (req, body, done) => {
  done(null, body);
});

fastify.addContentTypeParser('application/pdf', { parseAs: 'buffer' }, (req, body, done) => {
  done(null, body);
});

fastify.addContentTypeParser('text/plain', { parseAs: 'buffer' }, (req, body, done) => {
  done(null, body);
});

fastify.addContentTypeParser('application/msword', { parseAs: 'buffer' }, (req, body, done) => {
  done(null, body);
});

fastify.addContentTypeParser('application/vnd.openxmlformats-officedocument.wordprocessingml.document', { parseAs: 'buffer' }, (req, body, done) => {
  done(null, body);
});

// Simple in-memory storage for demo
const demoData = {
  users: new Map(),
  conversations: new Map(),
  knowledge: new Map()
};

// Prosta pamięć tokenów Allegro (na czas działania procesu)
const allegroTokens: Record<string, any> = {};

// Prosta pamięć ustawień BOK-AI (na czas działania procesu)
const bokSettings: Record<string, { autoReply: boolean; learning: boolean }> = {};

// Prosta pamięć przeczytanych rozmów (na czas działania procesu)
const readThreads: Record<string, Set<string>> = {};

async function buildServer(): Promise<FastifyInstance> {
  // CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  // Health check
  fastify.get('/health', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'BOK-AI Simple Server Running'
    };
  });

  // Simple auth
  fastify.post('/auth/register', async (request, reply) => {
    const { email, password, tenantName } = request.body as any;
    
    const userId = `user_${Date.now()}`;
    const tenantId = `tenant_${Date.now()}`;
    
    demoData.users.set(email, {
      id: userId,
      email,
      password, // In real app: hash this!
      tenantId,
      tenantName
    });

    return {
      token: `demo_token_${userId}`,
      user: { id: userId, email },
      tenant: { id: tenantId, name: tenantName }
    };
  });

  fastify.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body as any;
    
    const user = demoData.users.get(email);
    if (!user || user.password !== password) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    return {
      token: `demo_token_${user.id}`,
      user: { id: user.id, email: user.email },
      tenant: { id: user.tenantId, name: user.tenantName }
    };
  });

  // Simple chat endpoint
  fastify.post('/api/chat', async (request, reply) => {
    const { message } = request.body as any;
    
    // Simple responses based on keywords
    let response = "Dziękuję za pytanie! ";
    
    if (message.toLowerCase().includes('smartfon') || message.toLowerCase().includes('telefon')) {
      response += "Smartfon XYZ Pro jest dostępny w cenie 2499 PLN. Ma ekran 6.5 cala, 128GB pamięci i aparat 48MP.";
    } else if (message.toLowerCase().includes('dostawa') || message.toLowerCase().includes('wysyłka')) {
      response += "Oferujemy dostawę kurierem (15 PLN, 1-2 dni) lub Paczkomatami (12 PLN, 1-2 dni). Darmowa dostawa powyżej 200 PLN.";
    } else if (message.toLowerCase().includes('zwrot') || message.toLowerCase().includes('reklamacja')) {
      response += "Masz 14 dni na zwrot bez podania przyczyny. Koszt zwrotu po stronie klienta. Zwrot pieniędzy w ciągu 7 dni.";
    } else if (message.toLowerCase().includes('laptop') || message.toLowerCase().includes('komputer')) {
      response += "Laptop Gaming ABC z procesorem i7, 16GB RAM, RTX 3060 za 4999 PLN. Idealny do gier i pracy.";
    } else {
      response += "Jestem asystentem Demo Store. Mogę pomóc z informacjami o produktach, dostawie i zwrotach.";
    }

    const conversationId = `conv_${Date.now()}`;
    
    return {
      response,
      confidence: 0.85,
      sources: ['Demo Knowledge Base'],
      conversationId,
      responseTime: 150,
      cost: 0.02
    };
  });

  // Simple knowledge endpoint
  fastify.post('/api/knowledge', async (request, reply) => {
    const { title, content, category, tags } = request.body as any;
    
    const docId = `doc_${Date.now()}`;
    
    demoData.knowledge.set(docId, {
      id: docId,
      title,
      content,
      category: category || 'general',
      tags: tags || [],
      createdAt: new Date()
    });

    return {
      docId,
      title,
      category: category || 'general',
      tags: tags || [],
      message: 'Knowledge added successfully'
    };
  });

  // Threads endpoint - pobiera prawdziwe rozmowy z Allegro z ostatnimi wiadomościami
  fastify.get('/api/threads', async (request, reply) => {
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    const { dateFrom, dateTo, platform, status, search, limit = '20', offset = '0' } = request.query as any;
    const tokens = allegroTokens[tenantId];
    
    if (!tokens || !tokens.access_token) {
      return reply.code(401).send({ threads: [], notConnected: true });
    }
    
    try {
      // Pobierz listę rozmów z paginacją
      const allegroRes = await fetch(`https://api.allegro.pl/messaging/threads?limit=${Math.min(parseInt(limit), 20)}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/vnd.allegro.public.v1+json',
        }
      });
      
      if (!allegroRes.ok) {
        const errorText = await allegroRes.text();
        console.error('Allegro API error:', errorText);
        return reply.code(allegroRes.status).send({ threads: [], error: 'Allegro API error' });
      }
      
      const data = await allegroRes.json() as any;
      console.log('Allegro API threads response:', JSON.stringify(data, null, 2));
      
      // Pobierz ostatnie wiadomości dla każdej rozmowy (batch processing)
      let threadsWithMessages = await Promise.all(
        (data.threads || []).map(async (t: any) => {
          try {
            // Pobierz wiadomości dla tej rozmowy (limit=20 dla wyszukiwania)
            const messagesRes = await fetch(`https://api.allegro.pl/messaging/threads/${t.id}/messages?limit=20`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'Accept': 'application/vnd.allegro.public.v1+json',
              }
            });
            
            let lastMessage = null;
            let allMessages = [];
            if (messagesRes.ok) {
              const messagesData = await messagesRes.json() as any;
              if (messagesData.messages && messagesData.messages.length > 0) {
                // Ostatnia wiadomość (pierwsza w odpowiedzi)
                const msg = messagesData.messages[0];
                lastMessage = {
                  id: msg.id,
                  content: msg.text || msg.content || 'Brak treści',
                  sender: msg.author?.isInterlocutor ? 'customer' : 'bot',
                  timestamp: msg.createdAt || msg.sentAt || new Date(),
                  author: msg.author?.login || 'Nieznany'
                };
                
                // Wszystkie wiadomości dla wyszukiwania
                allMessages = messagesData.messages.map((msg: any) => ({
                  id: msg.id,
                  content: msg.text || msg.content || 'Brak treści',
                  sender: msg.author?.isInterlocutor ? 'customer' : 'bot',
                  timestamp: msg.createdAt || msg.sentAt || new Date(),
                  author: msg.author?.login || 'Nieznany'
                }));
              }
            }
            
            // Określ status na podstawie ostatniej wiadomości i czy została przeczytana
            let status = 'active';
            if (lastMessage) {
              if (lastMessage.sender === 'customer') {
                // Sprawdź czy wiadomość została przeczytana
                if (readThreads[tenantId] && readThreads[tenantId].has(t.id)) {
                  status = 'viewed'; // Przeczytana ale nieodpowiedziana = wyświetlona
                } else {
                  status = 'active'; // Nieprzeczytana = aktywna
                }
              } else {
                status = 'answered'; // Ostatnia wiadomość od bota = odpowiedziane
              }
            }
            
            // Sprawdź czy wątek został przeczytany w naszym systemie
            const isReadInOurSystem = readThreads[tenantId] && readThreads[tenantId].has(t.id);
            
            return {
              id: t.id,
              platform: 'allegro',
              customerName: t.interlocutor?.login || 'Klient',
              status: status,
              unreadCount: (t.read || isReadInOurSystem) ? 0 : 1,
              lastActivity: t.lastMessageDateTime || new Date(),
              lastMessagePreview: lastMessage ? lastMessage.content : 'Brak wiadomości',
              messages: allMessages.length > 0 ? allMessages : (lastMessage ? [lastMessage] : [
                {
                  id: 'no-message',
                  content: 'Brak wiadomości',
                  sender: 'customer',
                  timestamp: t.lastMessageDateTime || new Date()
                }
              ])
            };
          } catch (error) {
            console.error(`Failed to fetch messages for thread ${t.id}:`, error);
            
            // Określ status na podstawie domyślnego - aktywny
            let status = 'active';
            
            // Sprawdź czy wątek został przeczytany w naszym systemie
            const isReadInOurSystem = readThreads[tenantId] && readThreads[tenantId].has(t.id);
            
            return {
              id: t.id,
              platform: 'allegro',
              customerName: t.interlocutor?.login || 'Klient',
              status: status,
              unreadCount: (t.read || isReadInOurSystem) ? 0 : 1,
              lastActivity: t.lastMessageDateTime || new Date(),
              lastMessagePreview: 'Błąd ładowania wiadomości',
              messages: [
                {
                  id: 'error-message',
                  content: 'Błąd ładowania wiadomości',
                  sender: 'customer',
                  timestamp: t.lastMessageDateTime || new Date()
                }
              ]
            };
          }
        })
      );
      
      // Filtruj wyniki na podstawie parametrów
      if (dateFrom || dateTo || platform || status || search) {
        threadsWithMessages = threadsWithMessages.filter((thread: any) => {
          // Filtrowanie po datach
          if (dateFrom || dateTo) {
            const threadDate = new Date(thread.lastActivity);
            if (dateFrom && threadDate < new Date(dateFrom)) return false;
            if (dateTo && threadDate > new Date(dateTo)) return false;
          }
          
          // Filtrowanie po platformie
          if (platform && platform !== 'Wszystkie' && thread.platform !== platform.toLowerCase()) {
            return false;
          }
          
          // Filtrowanie po statusie
          if (status && status !== 'Wszystkie') {
            if (status === 'Aktywne' && thread.status !== 'active') return false;
            if (status === 'Odpowiedziane' && thread.status !== 'answered') return false;
            if (status === 'Wyświetlona' && thread.status !== 'viewed') return false;
          }
          
          // Filtrowanie po wyszukiwaniu (usunięte - robione lokalnie w frontend)
          
          return true;
        });
      }
      
      return { threads: threadsWithMessages };
    } catch (err) {
      console.error('Failed to fetch threads:', err);
      return reply.code(500).send({ threads: [], error: 'Failed to fetch threads' });
    }
  });

  // Mock insights endpoint
  fastify.get('/api/insights', async () => {
    return {
      metrics: {
        totalConversations: 45,
        averageConfidence: 0.82,
        humanTakeoverRate: 0.15,
        averageResponseTime: 1200,
        topIntents: [
          { intent: 'product', count: 18 },
          { intent: 'shipping', count: 12 },
          { intent: 'return', count: 8 }
        ],
        costPerConversation: 0.03
      },
      recommendations: [
        'Dodaj więcej informacji o produktach',
        'Skróć czas odpowiedzi dla pytań o dostawę'
      ]
    };
  });

  // Mock feedback endpoint
  fastify.post('/api/feedback', async (request, reply) => {
    const { conversationId, type, rating } = request.body as any;
    
    return { 
      message: 'Feedback recorded successfully',
      conversationId,
      type,
      rating
    };
  });

  // Allegro OAuth endpoints
  fastify.get('/api/allegro/status', async (request, reply) => {
    // Pobieramy tenantId z query lub localStorage (demo-tenant fallback)
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    const tokens = allegroTokens[tenantId];
    return {
      connected: !!tokens,
      environment: process.env.ALLEGRO_ENVIRONMENT || 'sandbox',
      accountName: tokens?.accountName || undefined,
      lastSync: tokens?.lastSync || undefined
    };
  });

  fastify.get('/api/allegro/auth', async (request, reply) => {
    const { tenantId } = request.query as { tenantId: string };
    if (!tenantId) {
      return reply.code(400).send({ error: 'tenantId is required' });
    }
    const allegroAuthUrl = `https://allegro.pl/auth/oauth/authorize?response_type=code&client_id=${process.env.ALLEGRO_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.ALLEGRO_REDIRECT_URI || 'http://localhost:3001/api/allegro/callback')}&scope=allegro:api:messaging%20allegro:api:orders:read%20allegro:api:disputes%20allegro:api:shipments:read%20allegro:api:profile:read&state=${tenantId}`;
    return reply.redirect(allegroAuthUrl);
  });

  fastify.get('/api/allegro/callback', async (request, reply) => {
    const { code, state } = request.query as { code: string; state: string };
    const tenantId = state || 'demo-tenant';
    if (!code) {
      console.error('Brak kodu autoryzacyjnego w callback!');
      return reply.code(400).send({ error: 'Authorization code is required' });
    }
    try {
      const tokenResponse = await fetch('https://allegro.pl/auth/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.ALLEGRO_CLIENT_ID}:${process.env.ALLEGRO_CLIENT_SECRET}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: process.env.ALLEGRO_REDIRECT_URI || 'http://localhost:3001/api/allegro/callback'
        })
      });
      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error('Token exchange failed:', error);
        return reply.redirect('http://localhost:3000/integrations?allegro=error');
      }
      const tokens = await tokenResponse.json();
      console.log('Allegro tokens obtained:', tokens);
      // Zapisz tokeny w pamięci (per tenant)
      allegroTokens[tenantId] = tokens;
      return reply.redirect('http://localhost:3000/integrations?allegro=connected');
    } catch (error) {
      console.error('OAuth callback error:', error);
      return reply.redirect('http://localhost:3000/integrations?allegro=error');
    }
  });

  fastify.post('/api/allegro/disconnect', async (request, reply) => {
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    delete allegroTokens[tenantId];
    return { success: true, message: 'Disconnected from Allegro' };
  });

  // Endpoint do pobierania ofert
  fastify.get('/api/allegro/offers', async (request, reply) => {
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    const tokens = allegroTokens[tenantId];
    
    if (!tokens || !tokens.access_token) {
      return reply.code(401).send({ error: 'Not connected to Allegro' });
    }
    
    try {
      const allegroRes = await fetch('https://api.allegro.pl/sale/offers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/vnd.allegro.public.v1+json',
        }
      });
      
      if (!allegroRes.ok) {
        const errorText = await allegroRes.text();
        return reply.code(allegroRes.status).send({ error: 'Allegro API error', details: errorText });
      }
      
      const data = await allegroRes.json() as any;
      return { offers: data.offers || [] };
    } catch (err) {
      return reply.code(500).send({ error: 'Failed to fetch offers', details: (err as Error).message });
    }
  });

  // Endpoint do pobierania zamówień
  fastify.get('/api/allegro/orders', async (request, reply) => {
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    const tokens = allegroTokens[tenantId];
    
    if (!tokens || !tokens.access_token) {
      return reply.code(401).send({ error: 'Not connected to Allegro' });
    }
    
    try {
      const allegroRes = await fetch('https://api.allegro.pl/order/checkout-forms', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/vnd.allegro.public.v1+json',
        }
      });
      
      if (!allegroRes.ok) {
        const errorText = await allegroRes.text();
        return reply.code(allegroRes.status).send({ error: 'Allegro API error', details: errorText });
      }
      
      const data = await allegroRes.json() as any;
      return { orders: data.checkoutForms || [] };
    } catch (err) {
      return reply.code(500).send({ error: 'Failed to fetch orders', details: (err as Error).message });
    }
  });

  // Endpoint do pobierania przesyłek
  fastify.get('/api/allegro/shipments', async (request, reply) => {
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    const tokens = allegroTokens[tenantId];
    
    if (!tokens || !tokens.access_token) {
      return reply.code(401).send({ error: 'Not connected to Allegro' });
    }
    
    try {
      const allegroRes = await fetch('https://api.allegro.pl/sale/shipments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/vnd.allegro.public.v1+json',
        }
      });
      
      if (!allegroRes.ok) {
        const errorText = await allegroRes.text();
        return reply.code(allegroRes.status).send({ error: 'Allegro API error', details: errorText });
      }
      
      const data = await allegroRes.json() as any;
      return { shipments: data.shipments || [] };
    } catch (err) {
      return reply.code(500).send({ error: 'Failed to fetch shipments', details: (err as Error).message });
    }
  });


  // Endpoint do pobierania pełnej historii rozmów (z paginacją)
  fastify.get('/api/threads/history', async (request, reply) => {
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    const { limit = '100', offset = '0', dateFrom, dateTo } = request.query as any;
    const tokens = allegroTokens[tenantId];
    
    if (!tokens || !tokens.access_token) {
      return reply.code(401).send({ error: 'Not connected to Allegro' });
    }
    
    try {
      // Pobierz więcej rozmów (maksymalnie 1000)
      const allegroRes = await fetch(`https://api.allegro.pl/messaging/threads?limit=${Math.min(parseInt(limit), 1000)}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/vnd.allegro.public.v1+json',
        }
      });
      
      if (!allegroRes.ok) {
        const errorText = await allegroRes.text();
        return reply.code(allegroRes.status).send({ error: 'Allegro API error', details: errorText });
      }
      
      const data = await allegroRes.json() as any;
      const threads = data.threads || [];
      
      // Filtruj po datach jeśli podano
      let filteredThreads = threads;
      if (dateFrom || dateTo) {
        filteredThreads = threads.filter((thread: any) => {
          const threadDate = new Date(thread.lastMessageDateTime || thread.createdAt);
          if (dateFrom && threadDate < new Date(dateFrom)) return false;
          if (dateTo && threadDate > new Date(dateTo)) return false;
          return true;
        });
      }
      
      return { 
        threads: filteredThreads,
        total: data.count || threads.length,
        hasMore: threads.length === parseInt(limit)
      };
    } catch (err) {
      return reply.code(500).send({ error: 'Failed to fetch thread history', details: (err as Error).message });
    }
  });

  // Endpoint do eksportu rozmów do CSV
  fastify.get('/api/threads/export', async (request, reply) => {
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    const { dateFrom, dateTo } = request.query as any;
    const tokens = allegroTokens[tenantId];
    
    if (!tokens || !tokens.access_token) {
      return reply.code(401).send({ error: 'Not connected to Allegro' });
    }
    
    try {
      // Pobierz rozmowy (limit 20 - maksymalny dozwolony przez Allegro)
      const allegroRes = await fetch('https://api.allegro.pl/messaging/threads?limit=20', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/vnd.allegro.public.v1+json',
        }
      });
      
      if (!allegroRes.ok) {
        const errorText = await allegroRes.text();
        return reply.code(allegroRes.status).send({ error: 'Allegro API error', details: errorText });
      }
      
      const data = await allegroRes.json() as any;
      const threads = data.threads || [];
      
      // Pobierz ostatnie wiadomości dla każdej rozmowy (batch processing)
      const threadsWithMessages = await Promise.all(
        threads.map(async (thread: any) => {
          try {
            // Pobierz ostatnią wiadomość dla tej rozmowy
            const messagesRes = await fetch(`https://api.allegro.pl/messaging/threads/${thread.id}/messages?limit=1`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'Accept': 'application/vnd.allegro.public.v1+json',
              }
            });
            
            let lastMessage = null;
            let messageCount = 0;
            if (messagesRes.ok) {
              const messagesData = await messagesRes.json() as any;
              if (messagesData.messages && messagesData.messages.length > 0) {
                lastMessage = messagesData.messages[0];
                messageCount = messagesData.count || 1;
              }
            }
            
            return {
              ...thread,
              lastMessage,
              messageCount
            };
          } catch (error) {
            console.error(`Failed to fetch messages for thread ${thread.id}:`, error);
            return {
              ...thread,
              lastMessage: null,
              messageCount: 0
            };
          }
        })
      );
      
      // Filtruj po datach jeśli podano
      let filteredThreads = threadsWithMessages;
      if (dateFrom || dateTo) {
        filteredThreads = threadsWithMessages.filter((thread: any) => {
          const threadDate = new Date(thread.lastMessageDateTime || thread.createdAt);
          if (dateFrom && threadDate < new Date(dateFrom)) return false;
          if (dateTo && threadDate > new Date(dateTo)) return false;
          return true;
        });
      }
      
      // Generuj CSV
      const csvHeaders = [
        'ID Rozmowy',
        'Klient',
        'Platforma',
        'Status',
        'Data utworzenia',
        'Ostatnia aktywność',
        'Liczba wiadomości',
        'Ostatnia wiadomość'
      ];
      
      const csvRows = filteredThreads.map((thread: any) => [
        thread.id,
        thread.interlocutor?.login || 'Nieznany',
        'Allegro',
        thread.read ? 'Przeczytane' : 'Nieprzeczytane',
        new Date(thread.lastMessageDateTime || thread.createdAt).toLocaleString('pl-PL'),
        new Date(thread.lastMessageDateTime || thread.createdAt).toLocaleString('pl-PL'),
        thread.messageCount || 0,
        thread.lastMessage?.text || thread.lastMessage?.content || 'Brak treści'
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="rozmowy_allegro_${new Date().toISOString().split('T')[0]}.csv"`);
      
      return csvContent;
    } catch (err) {
      return reply.code(500).send({ error: 'Failed to export threads', details: (err as Error).message });
    }
  });

  // Endpoint do pobierania faktur
  fastify.get('/api/allegro/billing', async (request, reply) => {
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    const tokens = allegroTokens[tenantId];
    
    if (!tokens || !tokens.access_token) {
      return reply.code(401).send({ error: 'Not connected to Allegro' });
    }
    
    try {
      const allegroRes = await fetch('https://api.allegro.pl/billing/billing-entries', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/vnd.allegro.public.v1+json',
        }
      });
      
      if (!allegroRes.ok) {
        const errorText = await allegroRes.text();
        return reply.code(allegroRes.status).send({ error: 'Allegro API error', details: errorText });
      }
      
      const data = await allegroRes.json() as any;
      return { billing: data.billingEntries || [] };
    } catch (err) {
      return reply.code(500).send({ error: 'Failed to fetch billing', details: (err as Error).message });
    }
  });

  // Endpoint do sprawdzania nowych wiadomości i powiadomień
  fastify.get('/api/notifications', async (request, reply) => {
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    const tokens = allegroTokens[tenantId];
    
    if (!tokens || !tokens.access_token) {
      return reply.code(401).send({ error: 'Not connected to Allegro' });
    }
    
    try {
      // Pobierz ostatnie wiadomości z Allegro
      const allegroRes = await fetch('https://api.allegro.pl/messaging/threads?limit=20', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/vnd.allegro.public.v1+json',
        }
      });
      
      if (!allegroRes.ok) {
        const errorText = await allegroRes.text();
        return reply.code(allegroRes.status).send({ error: 'Allegro API error', details: errorText });
      }
      
      const data = await allegroRes.json() as any;
      const threads = data.threads || [];
      
      console.log('=== NOTIFICATIONS DEBUG ===');
      console.log('Total threads from Allegro:', threads.length);
      console.log('Current time:', new Date().toISOString());
      
      // Sprawdź nowe wiadomości (ostatnie 5 minut) - tylko te które mogą być nieprzeczytane
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      // Pobierz informacje o ostatnich wiadomościach dla wszystkich wątków
      const threadsWithLastMessage = await Promise.all(
        threads.map(async (thread: any) => {
          try {
            const messagesRes = await fetch(`https://api.allegro.pl/messaging/threads/${thread.id}/messages?limit=1`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'Accept': 'application/vnd.allegro.public.v1+json',
              }
            });
            
            if (messagesRes.ok) {
              const messagesData = await messagesRes.json() as any;
              if (messagesData.messages && messagesData.messages.length > 0) {
                const lastMsg = messagesData.messages[0];
                return {
                  ...thread,
                  lastMessageSender: lastMsg.author?.isInterlocutor ? 'customer' : 'bot'
                };
              }
            }
            return { ...thread, lastMessageSender: 'unknown' };
          } catch (error) {
            console.error(`Failed to fetch last message for thread ${thread.id}:`, error);
            return { ...thread, lastMessageSender: 'unknown' };
          }
        })
      );
      
      // Sprawdź nowe rozmowy (ostatnie 10 minut) - tylko te które nie zostały przeczytane
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const newThreads = threadsWithLastMessage.filter((thread: any) => {
        if (!thread.lastMessageDateTime) return false;
        const threadTime = new Date(thread.lastMessageDateTime);
        const isRead = readThreads[tenantId] && readThreads[tenantId].has(thread.id);
        return threadTime > tenMinutesAgo && thread.lastMessageSender === 'customer' && !isRead;
      });
      console.log('New threads count:', newThreads.length);
      
      // Sprawdź rozmowy czekające na odpowiedź (ostatnia wiadomość od klienta, niezależnie od przeczytania)
      const unansweredThreads = threadsWithLastMessage.filter((thread: any) => {
        return thread.lastMessageSender === 'customer';
      });
      console.log('Unanswered threads count:', unansweredThreads.length);
      
      // Łączna liczba powiadomień = nowe rozmowy + rozmowy czekające na odpowiedź (bez duplikacji)
      const totalNotifications = newThreads.length + unansweredThreads.length;
      
      return {
        notifications: {
          newMessages: 0, // Usunięte - nie potrzebujemy tego
          newThreads: newThreads.length,
          unansweredThreads: unansweredThreads.length,
          total: totalNotifications
        },
        newThreadIds: newThreads.map((t: any) => t.id),
        unansweredThreadIds: unansweredThreads.map((t: any) => t.id),
        lastChecked: new Date().toISOString()
      };
    } catch (err) {
      return reply.code(500).send({ error: 'Failed to check notifications', details: (err as Error).message });
    }
  });

  // Debug endpoint dla Allegro
  fastify.get('/api/allegro/debug', async (request, reply) => {
    const { tenantId } = request.query as { tenantId: string };
    
    const allegroAuthUrl = `https://allegro.pl/auth/oauth/authorize?response_type=code&client_id=${process.env.ALLEGRO_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.ALLEGRO_REDIRECT_URI || 'http://localhost:3001/api/allegro/callback')}&scope=allegro:api:messaging%20allegro:api:orders:read%20allegro:api:disputes%20allegro:api:shipments:read%20allegro:api:profile:read`;
    
    return {
      tenantId,
      clientId: process.env.ALLEGRO_CLIENT_ID,
      redirectUri: process.env.ALLEGRO_REDIRECT_URI,
              environment: process.env.ALLEGRO_ENVIRONMENT || 'production',
      fullUrl: allegroAuthUrl,
      message: 'Debug info for Allegro OAuth'
    };
  });

  fastify.get('/api/allegro/threads', async (request, reply) => {
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    const tokens = allegroTokens[tenantId];
    if (!tokens || !tokens.access_token) {
      return reply.code(401).send({ error: 'Not connected to Allegro' });
    }
    try {
      const allegroRes = await fetch('https://api.allegro.pl/messaging/threads?limit=20', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/vnd.allegro.public.v1+json',
        }
      });
      if (!allegroRes.ok) {
        const errorText = await allegroRes.text();
        return reply.code(allegroRes.status).send({ error: 'Allegro API error', details: errorText });
      }
      const data = await allegroRes.json() as any;
      console.log('Allegro API threads response:', JSON.stringify(data, null, 2));
      return { threads: data.threads || [] };
    } catch (err) {
      return reply.code(500).send({ error: 'Failed to fetch threads', details: (err as Error).message });
    }
  });

  // Endpoint do pobierania wiadomości z konkretnej rozmowy
  fastify.get('/api/allegro/threads/:threadId/messages', async (request, reply) => {
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    const { threadId } = request.params as { threadId: string };
    const tokens = allegroTokens[tenantId];
    
    if (!tokens || !tokens.access_token) {
      return reply.code(401).send({ error: 'Not connected to Allegro' });
    }
    
    try {
      const allegroRes = await fetch(`https://api.allegro.pl/messaging/threads/${threadId}/messages?limit=20`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/vnd.allegro.public.v1+json',
        }
      });
      
      if (!allegroRes.ok) {
        const errorText = await allegroRes.text();
        console.error('Allegro messages API error:', errorText);
        return reply.code(allegroRes.status).send({ error: 'Allegro API error', details: errorText });
      }
      
      const data = await allegroRes.json() as any;
      console.log('Allegro messages response:', JSON.stringify(data, null, 2));
      
      // Mapuj wiadomości na strukturę frontendową i posortuj chronologicznie (najstarsze na górze, najnowsze na dole)
                        const messages = (data.messages || [])
                    .map((msg: any) => ({
                      id: msg.id,
                      content: msg.text || msg.content || 'Brak treści',
                      sender: msg.author?.isInterlocutor ? 'customer' : 'bot',
                      timestamp: msg.createdAt || msg.sentAt || new Date(),
                      author: msg.author?.login || 'Nieznany',
                      attachments: (msg.attachments || []).map((att: any) => ({
                        id: att.url?.split('/').pop() || att.id,
                        filename: att.fileName || 'Załącznik',
                        mimeType: att.mimeType,
                        url: att.url,
                        originalId: att.id
                      })),
                      status: msg.author?.isInterlocutor ? 'received' : 'sent'
                    }))
                    .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                  
                  // Określ status rozmowy na podstawie ostatniej wiadomości
                  const lastMessage = messages[messages.length - 1];
                  let threadStatus = lastMessage?.sender === 'customer' ? 'waiting' : 'answered';
                  
                  // Sprawdź czy wątek jest przeczytany (read: false oznacza nieprzeczytany)
                  const threadInfo = await fetch(`https://api.allegro.pl/messaging/threads/${threadId}`, {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${tokens.access_token}`,
                      'Accept': 'application/vnd.allegro.public.v1+json',
                    }
                  });
                  
                  if (threadInfo.ok) {
                    const threadData = await threadInfo.json() as any;
                    if (threadData.read === false) {
                      threadStatus = 'active'; // Nieprzeczytany = aktywny
                    } else if (threadStatus === 'waiting') {
                      threadStatus = 'viewed'; // Przeczytany ale oczekuje = wyświetlony
                    }
                  }
                  
                  return { messages, threadStatus }; // Sortuj chronologicznie
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      return reply.code(500).send({ error: 'Failed to fetch messages', details: (err as Error).message });
    }
  });

  // Endpoint do oznaczania wiadomości jako przeczytane
  fastify.post('/api/allegro/threads/:threadId/read', async (request, reply) => {
    const { threadId } = request.params as any;
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    const tokens = allegroTokens[tenantId];
    
    if (!tokens || !tokens.access_token) {
      return reply.code(401).send({ error: 'Not connected to Allegro' });
    }
    
    try {
      // Oznacz wątek jako przeczytany używając właściwego endpointu Allegro
      const markReadRes = await fetch(`https://api.allegro.pl/messaging/threads/${threadId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/vnd.allegro.public.v1+json',
          'Content-Type': 'application/vnd.allegro.public.v1+json',
        },
        body: JSON.stringify({
          read: true
        })
      });
      
      if (!markReadRes.ok) {
        const errorText = await markReadRes.text();
        console.error('Failed to mark thread as read:', errorText);
        return reply.code(markReadRes.status).send({ error: 'Failed to mark thread as read', details: errorText });
      }
      
      console.log(`Successfully marked thread ${threadId} as read`);
      
      // Zapisz w pamięci że ta rozmowa została przeczytana
      if (!readThreads[tenantId]) {
        readThreads[tenantId] = new Set();
      }
      readThreads[tenantId].add(threadId);
      
      console.log(`Marked thread ${threadId} as read for tenant ${tenantId}`);
      return { success: true, message: 'Thread marked as read' };
    } catch (err) {
      return reply.code(500).send({ error: 'Failed to mark messages as read', details: (err as Error).message });
    }
  });



  // Endpoint do deklaracji załącznika (przed uploadem)
  fastify.post('/api/attachments/declare', async (request, reply) => {
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    const { filename, size, mimeType } = request.body as { filename: string; size: number; mimeType: string };
    const tokens = allegroTokens[tenantId];
    
    if (!tokens || !tokens.access_token) {
      return reply.code(401).send({ error: 'Not connected to Allegro' });
    }
    
    // Sprawdź rozmiar pliku (max 5MB)
    if (size > 5 * 1024 * 1024) {
      return reply.code(400).send({ error: 'File too large. Maximum size is 5MB.' });
    }
    
    // Sprawdź typ MIME
    const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedMimeTypes.includes(mimeType)) {
      return reply.code(400).send({ 
        error: 'Unsupported file type', 
        details: `Supported types: ${allowedMimeTypes.join(', ')}` 
      });
    }
    
    try {
      const allegroRes = await fetch('https://api.allegro.pl/messaging/message-attachments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/vnd.allegro.public.v1+json',
          'Content-Type': 'application/vnd.allegro.public.v1+json',
        },
        body: JSON.stringify({
          filename,
          size
        })
      });
      
      if (!allegroRes.ok) {
        const errorText = await allegroRes.text();
        console.error('Allegro attachment declaration error:', errorText);
        return reply.code(allegroRes.status).send({ error: 'Allegro API error', details: errorText });
      }
      
      const data = await allegroRes.json() as any;
      return { attachmentId: data.id };
    } catch (err) {
      console.error('Failed to declare attachment:', err);
      return reply.code(500).send({ error: 'Failed to declare attachment', details: (err as Error).message });
    }
  });

  // Endpoint do uploadu załącznika
  fastify.put('/api/attachments/:attachmentId/upload', async (request, reply) => {
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    const { attachmentId } = request.params as { attachmentId: string };
    const { mimeType } = request.query as { mimeType: string };
    const tokens = allegroTokens[tenantId];
    
    if (!tokens || !tokens.access_token) {
      return reply.code(401).send({ error: 'Not connected to Allegro' });
    }
    
    try {
      // Body jest już Buffer dzięki parserom
      const fileBuffer = request.body as Buffer;
      
      console.log('Uploading file:', {
        attachmentId,
        mimeType,
        size: fileBuffer.length,
        contentType: mimeType
      });
      
      const allegroRes = await fetch(`https://api.allegro.pl/messaging/message-attachments/${attachmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/vnd.allegro.public.v1+json',
          'Content-Type': mimeType || 'application/octet-stream',
        },
        body: fileBuffer
      });
      
      console.log('Allegro upload response status:', allegroRes.status);
      
      if (!allegroRes.ok) {
        const errorText = await allegroRes.text();
        console.error('Allegro attachment upload error:', errorText);
        return reply.code(allegroRes.status).send({ error: 'Allegro API error', details: errorText });
      }
      
      const data = await allegroRes.json() as any;
      console.log('Upload successful:', data);
      return { success: true, attachmentId: data.id };
    } catch (err) {
      console.error('Failed to upload attachment:', err);
      return reply.code(500).send({ error: 'Failed to upload attachment', details: (err as Error).message });
    }
  });

  // Endpoint do pobierania załączników (proxy)
  fastify.get('/api/attachments/:attachmentId', async (request, reply) => {
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    const { attachmentId } = request.params as { attachmentId: string };
    const tokens = allegroTokens[tenantId];
    
    if (!tokens || !tokens.access_token) {
      return reply.code(401).send({ error: 'Not connected to Allegro' });
    }
    
    try {
      // Pobierz dane załącznika z wiadomości
      const allegroRes = await fetch(`https://api.allegro.pl/messaging/message-attachments/${attachmentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': '*/*',
        },
      });
      
      if (!allegroRes.ok) {
        const errorText = await allegroRes.text();
        console.error('Allegro attachment fetch error:', errorText);
        return reply.code(allegroRes.status).send({ error: 'Allegro API error', details: errorText });
      }
      
      // Sprawdź Content-Type odpowiedzi
      const contentType = allegroRes.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        // To są metadane załącznika, pobierz plik
        const attachmentData = await allegroRes.json() as any;
        
        if (attachmentData.url) {
          const fileRes = await fetch(attachmentData.url, {
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
            },
          });
          
          if (!fileRes.ok) {
            return reply.code(fileRes.status).send({ error: 'Failed to fetch file' });
          }
          
          const fileBuffer = await fileRes.arrayBuffer();
          
          // Ustaw odpowiednie nagłówki
          reply.header('Content-Type', attachmentData.mimeType || 'application/octet-stream');
          reply.header('Content-Disposition', `inline; filename="${attachmentData.fileName || 'attachment'}"`);
          
          return Buffer.from(fileBuffer);
        }
      } else {
        // To jest bezpośrednio plik
        const fileBuffer = await allegroRes.arrayBuffer();
        
        // Ustaw odpowiednie nagłówki
        reply.header('Content-Type', contentType || 'application/octet-stream');
        reply.header('Content-Disposition', `inline; filename="attachment"`);
        
        return Buffer.from(fileBuffer);
      }
      
      return reply.code(404).send({ error: 'Attachment not found' });
    } catch (err) {
      console.error('Failed to fetch attachment:', err);
      return reply.code(500).send({ error: 'Failed to fetch attachment', details: (err as Error).message });
    }
  });

  // Endpoint do wysyłania wiadomości do rozmowy Allegro (z obsługą załączników)
  fastify.post('/api/threads/:threadId/messages', async (request, reply) => {
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    const { threadId } = request.params as { threadId: string };
    const { content, attachments } = request.body as { content: string; attachments?: string[] };
    const tokens = allegroTokens[tenantId];
    
    if (!tokens || !tokens.access_token) {
      return reply.code(401).send({ error: 'Not connected to Allegro' });
    }
    
    if (!content || !content.trim()) {
      return reply.code(400).send({ error: 'Message content is required' });
    }
    
    try {
      // Przygotuj body z załącznikami jeśli są
      const messageBody: any = { text: content };
      if (attachments && attachments.length > 0) {
        messageBody.attachments = attachments.map(id => ({ id }));
      }
      
      // Wysyłamy wiadomość do Allegro API
      const allegroRes = await fetch(`https://api.allegro.pl/messaging/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/vnd.allegro.public.v1+json',
          'Content-Type': 'application/vnd.allegro.public.v1+json',
        },
        body: JSON.stringify(messageBody)
      });
      
      if (!allegroRes.ok) {
        const errorText = await allegroRes.text();
        console.error('Allegro send message API error:', errorText);
        return reply.code(allegroRes.status).send({ error: 'Allegro API error', details: errorText });
      }
      
      const data = await allegroRes.json() as any;
      console.log('Allegro send message response:', JSON.stringify(data, null, 2));
      
      return {
        success: true,
        messageId: data.id
      };
    } catch (err) {
      console.error('Failed to send message:', err);
      return reply.code(500).send({ error: 'Failed to send message', details: (err as Error).message });
    }
  });

  // Endpoint pobierania ustawień
  fastify.get('/api/settings', async (request, reply) => {
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    const settings = bokSettings[tenantId] || { autoReply: true, learning: true };
    return settings;
  });

  // Endpoint zapisywania ustawień
  fastify.post('/api/settings', async (request, reply) => {
    const tenantId = (request.query as any)?.tenantId || 'demo-tenant';
    const { autoReply, learning } = request.body as { autoReply: boolean; learning: boolean };
    bokSettings[tenantId] = { autoReply, learning };
    return { success: true };
  });

  return fastify;
}

// Start server
const start = async (): Promise<void> => {
  try {
    const server = await buildServer();
    const port = parseInt(process.env.PORT || '3001');
    const host = '0.0.0.0';

    await server.listen({ port, host });
    server.log.info(`🚀 BOK-AI Simple Server running on http://${host}:${port}`);
    server.log.info(`🔥 Ready for testing! Try: curl http://localhost:${port}/health`);
    
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

export { buildServer }; 