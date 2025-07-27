const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('bok_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    } as Record<string, string>;

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Auth methods
  async register(email: string, password: string, tenantName: string) {
    const response = await this.request<{
      token: string;
      user: { id: string; email: string };
      tenant: { id: string; name: string };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, tenantName }),
    });

    this.setToken(response.token);
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<{
      token: string;
      user: { id: string; email: string };
      tenant: { id: string; name: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.setToken(response.token);
    return response;
  }

  private setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('bok_token', token);
    }
  }

  logout() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bok_token');
    }
  }

  // Chat methods
  async sendMessage(message: string, threadId?: string, platform?: string) {
    return this.request<{
      response: string;
      confidence: number;
      sources: string[];
      conversationId: string;
      responseTime: number;
      cost: number;
    }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message, 
        threadId, 
        platform: platform || 'web' 
      }),
    });
  }

  // Platform threads
  async getThreads(dateFrom?: string, dateTo?: string, platform?: string, status?: string, limit?: number, offset?: number) {
    // Pobierz tenantId z localStorage lub demo-tenant
    let tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
    if (!tenantId) tenantId = 'demo-tenant';
    
    // Buduj parametry URL
    const params = new URLSearchParams({ tenantId });
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (platform && platform !== 'Wszystkie') params.append('platform', platform);
    if (status && status !== 'Wszystkie') params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    try {
      const response = await fetch(`${this.baseUrl}/api/threads?${params}`);
      if (response.status === 401) {
        return { threads: [], notConnected: true };
      }
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      // Mapuj odpowiedź na strukturę frontendową
      const threads = (data.threads || []).map((t: any) => ({
        id: t.id,
        platform: t.platform || 'allegro',
        customerName: t.customerName || t.buyer?.login || 'Klient',
        status: t.status || 'active',
        unreadCount: t.unreadCount || 0,
        lastActivity: t.lastActivity || t.modifiedAt || t.createdAt,
        messages: t.messages || [
          t.lastMessage ? {
            id: t.lastMessage.id,
            content: t.lastMessage.text,
            sender: t.lastMessage.sender || (t.lastMessage.author?.login === t.buyer?.login ? 'customer' : 'bot'),
            timestamp: t.lastMessage.createdAt
          } : {
            id: 'init',
            content: 'Brak wiadomości',
            sender: 'bot',
            timestamp: t.createdAt
          }
        ]
      }));
      return { threads };
    } catch (error) {
      return { threads: [], error: true };
    }
  }

  async sendThreadMessage(threadId: string, content: string, attachments?: string[]) {
    let tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
    if (!tenantId) tenantId = 'demo-tenant';
    
    try {
      const response = await fetch(`${this.baseUrl}/api/threads/${threadId}/messages?tenantId=${tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, attachments }),
      });
      
      if (response.status === 401) {
        throw new Error('Not connected to Allegro');
      }
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  // Upload file to Allegro
  async uploadFile(file: File): Promise<string> {
    let tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
    if (!tenantId) tenantId = 'demo-tenant';
    
    try {
      // Step 1: Declare attachment
      const declareResponse = await fetch(`${this.baseUrl}/api/attachments/declare?tenantId=${tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          size: file.size,
          mimeType: file.type
        }),
      });
      
      if (!declareResponse.ok) {
        const errorData = await declareResponse.json().catch(() => ({}));
        throw new Error(`Declaration failed: ${errorData.error || declareResponse.statusText}`);
      }
      
      const { attachmentId } = await declareResponse.json();
      
      // Step 2: Upload file
      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        attachmentId
      });
      
      const uploadResponse = await fetch(`${this.baseUrl}/api/attachments/${attachmentId}/upload?tenantId=${tenantId}&mimeType=${encodeURIComponent(file.type)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });
      
      console.log('Upload response status:', uploadResponse.status);
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(`Upload failed: ${errorData.error || uploadResponse.statusText}`);
      }
      
      return attachmentId;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }

  // Get detailed messages for a specific thread
  async getThreadMessages(threadId: string) {
    let tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
    if (!tenantId) tenantId = 'demo-tenant';
    
    try {
      const response = await fetch(`${this.baseUrl}/api/allegro/threads/${threadId}/messages?tenantId=${tenantId}`);
      if (response.status === 401) {
        return { messages: [], notConnected: true };
      }
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return { 
        messages: data.messages || [], 
        threadStatus: data.threadStatus || 'active' 
      };
    } catch (error) {
      console.error('Failed to fetch thread messages:', error);
      return { messages: [], error: true };
    }
  }

  // Health check
  async healthCheck() {
    return this.request<{
      status: string;
      timestamp: string;
      message: string;
    }>('/health');
  }

  // Sprawdzanie nowych powiadomień
  async getNotifications(): Promise<{
    notifications: {
      newMessages: number;
      newThreads: number;
      unansweredThreads: number;
      total: number;
    };
    newThreadIds: string[];
    unansweredThreadIds: string[];
    lastChecked: string;
  }> {
    let tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
    if (!tenantId) tenantId = 'demo-tenant';
    
    // Dodaj timestamp żeby wymusić odświeżenie
    const timestamp = Date.now();
    const response = await fetch(`${this.baseUrl}/api/notifications?tenantId=${tenantId}&_t=${timestamp}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Pobieranie pełnej historii rozmów
  async getThreadHistory(limit: number = 100, offset: number = 0, dateFrom?: string, dateTo?: string) {
    let tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
    if (!tenantId) tenantId = 'demo-tenant';
    
    const params = new URLSearchParams({
      tenantId,
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    
    const response = await fetch(`${this.baseUrl}/api/threads/history?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch thread history: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Eksport rozmów do CSV
  async exportThreadsToCSV(dateFrom?: string, dateTo?: string): Promise<Blob> {
    let tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
    if (!tenantId) tenantId = 'demo-tenant';
    
    const params = new URLSearchParams({ tenantId });
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    
    const response = await fetch(`${this.baseUrl}/api/threads/export?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to export threads: ${response.statusText}`);
    }
    
    return await response.blob();
  }

  // Oznacz wiadomości jako przeczytane
  async markThreadAsRead(threadId: string) {
    let tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
    if (!tenantId) tenantId = 'demo-tenant';
    
    const response = await fetch(`${this.baseUrl}/api/allegro/threads/${threadId}/read?tenantId=${tenantId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}) // Dodaj pusty obiekt zamiast pustego body
    });
    
    if (!response.ok) {
      throw new Error(`Failed to mark thread as read: ${response.statusText}`);
    }
    
    return await response.json();
  }


}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient; 