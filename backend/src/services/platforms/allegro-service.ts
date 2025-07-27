import { Logger } from 'pino';
import { EventEmitter } from 'events';

export interface AllegroConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}

export interface AllegroOAuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface AllegroMessage {
  id: string;
  text: string;
  author: {
    id: string;
    login: string;
  };
  createdAt: string;
  threadId: string;
  type: 'BUYER' | 'SELLER';
}

export interface AllegroThread {
  id: string;
  subject: string;
  messageCount: number;
  unreadCount: number;
  lastMessage?: AllegroMessage;
  createdAt: string;
  modifiedAt: string;
  offer?: {
    id: string;
    name: string;
  };
  buyer: {
    id: string;
    login: string;
  };
}

export class AllegroService extends EventEmitter {
  private logger: Logger;
  private config: AllegroConfig;
  private tokens: Map<string, AllegroOAuthTokens> = new Map();
  
  private readonly BASE_URLS = {
    production: {
      api: 'https://api.allegro.pl',
      auth: 'https://allegro.pl/auth/oauth'
    },
    sandbox: {
      api: 'https://api.allegro.pl.allegrosandbox.pl',
      auth: 'https://allegro.pl.allegrosandbox.pl/auth/oauth'
    }
  };

  constructor(config: AllegroConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
  }

  // OAuth2 Authorization Flow
  generateAuthUrl(state: string, tenantId: string): string {
    const baseUrl = this.BASE_URLS[this.config.environment].auth;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state: `${state}:${tenantId}`, // Include tenant info in state
      scope: 'allegro:api:messaging allegro:api:orders:read allegro:api:disputes allegro:api:shipments:read allegro:api:profile:read'
    });

    return `${baseUrl}/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, tenantId: string): Promise<AllegroOAuthTokens> {
    const baseUrl = this.BASE_URLS[this.config.environment].auth;
    
    try {
      const response = await fetch(`${baseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.config.redirectUri
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OAuth token exchange failed: ${error}`);
      }

      const tokens = await response.json() as AllegroOAuthTokens;
      
      // Store tokens for this tenant
      this.tokens.set(tenantId, tokens);
      
      this.logger.info({ tenantId }, 'Allegro OAuth tokens obtained successfully');
      
      return tokens;
    } catch (error) {
      this.logger.error({ error, tenantId }, 'Failed to exchange OAuth code for tokens');
      throw error;
    }
  }

  async refreshTokens(tenantId: string): Promise<AllegroOAuthTokens> {
    const currentTokens = this.tokens.get(tenantId);
    if (!currentTokens?.refresh_token) {
      throw new Error('No refresh token available for tenant');
    }

    const baseUrl = this.BASE_URLS[this.config.environment].auth;
    
    try {
      const response = await fetch(`${baseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: currentTokens.refresh_token
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token refresh failed: ${error}`);
      }

      const tokens = await response.json() as AllegroOAuthTokens;
      
      // Update stored tokens
      this.tokens.set(tenantId, tokens);
      
      this.logger.info({ tenantId }, 'Allegro tokens refreshed successfully');
      
      return tokens;
    } catch (error) {
      this.logger.error({ error, tenantId }, 'Failed to refresh Allegro tokens');
      throw error;
    }
  }

  private async makeAuthenticatedRequest(tenantId: string, endpoint: string, options: RequestInit = {}): Promise<Response> {
    let tokens = this.tokens.get(tenantId);
    if (!tokens) {
      throw new Error('No tokens available for tenant');
    }

    const baseUrl = this.BASE_URLS[this.config.environment].api;
    const url = `${baseUrl}${endpoint}`;

    const headers = {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Accept': 'application/vnd.allegro.public.v1+json',
      'Content-Type': 'application/vnd.allegro.public.v1+json',
      ...options.headers
    };

    let response = await fetch(url, {
      ...options,
      headers
    });

    // If token expired, try to refresh
    if (response.status === 401 && tokens.refresh_token) {
      this.logger.info({ tenantId }, 'Access token expired, refreshing...');
      
      try {
        tokens = await this.refreshTokens(tenantId);
        
        // Retry request with new token
        response = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            'Authorization': `Bearer ${tokens.access_token}`
          }
        });
      } catch (refreshError) {
        this.logger.error({ refreshError, tenantId }, 'Failed to refresh token');
        throw new Error('Authentication failed and token refresh unsuccessful');
      }
    }

    return response;
  }

  // Messages API
  async getMessageThreads(tenantId: string, limit: number = 50, offset: number = 0): Promise<AllegroThread[]> {
    try {
      const response = await this.makeAuthenticatedRequest(
        tenantId,
        `/messaging/threads?limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch message threads: ${error}`);
      }

      const data = await response.json() as { threads?: AllegroThread[] };
      return data.threads || [];
    } catch (error) {
      this.logger.error({ error, tenantId }, 'Failed to fetch Allegro message threads');
      throw error;
    }
  }

  async getThreadMessages(tenantId: string, threadId: string, limit: number = 50, offset: number = 0): Promise<AllegroMessage[]> {
    try {
      const response = await this.makeAuthenticatedRequest(
        tenantId,
        `/messaging/threads/${threadId}/messages?limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch thread messages: ${error}`);
      }

      const data = await response.json() as { messages?: AllegroMessage[] };
      return data.messages || [];
    } catch (error) {
      this.logger.error({ error, tenantId, threadId }, 'Failed to fetch Allegro thread messages');
      throw error;
    }
  }

  async sendMessage(tenantId: string, threadId: string, message: string): Promise<{ messageId: string }> {
    try {
      const response = await this.makeAuthenticatedRequest(
        tenantId,
        `/messaging/threads/${threadId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            text: message
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send message: ${error}`);
      }

      const data = await response.json() as { id: string };
      
      this.logger.info({ tenantId, threadId, messageId: data.id }, 'Message sent to Allegro successfully');
      
      return { messageId: data.id };
    } catch (error) {
      this.logger.error({ error, tenantId, threadId }, 'Failed to send message to Allegro');
      throw error;
    }
  }

  // Real-time message polling
  async startMessagePolling(tenantId: string, intervalMs: number = 30000): Promise<void> {
    const poll = async () => {
      try {
        const threads = await this.getMessageThreads(tenantId, 50, 0);
        
        for (const thread of threads) {
          if (thread.unreadCount > 0) {
            const messages = await this.getThreadMessages(tenantId, thread.id, thread.unreadCount, 0);
            
            // Emit new messages
            for (const message of messages) {
              if (message.type === 'BUYER') { // Only emit buyer messages
                this.emit('newMessage', {
                  tenantId,
                  threadId: thread.id,
                  message,
                  thread
                });
              }
            }
          }
        }
      } catch (error) {
        this.logger.error({ error, tenantId }, 'Error during message polling');
      }
    };

    // Initial poll
    await poll();
    
    // Set up interval polling
    const intervalId = setInterval(poll, intervalMs);
    
    // Store interval ID for cleanup
    this.emit('pollingStarted', { tenantId, intervalId });
    
    this.logger.info({ tenantId, intervalMs }, 'Started Allegro message polling');
  }

  async stopMessagePolling(tenantId: string, intervalId: NodeJS.Timeout): Promise<void> {
    clearInterval(intervalId);
    this.logger.info({ tenantId }, 'Stopped Allegro message polling');
  }

  // User info
  async getUserInfo(tenantId: string): Promise<any> {
    try {
      const response = await this.makeAuthenticatedRequest(tenantId, '/me');

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch user info: ${error}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error({ error, tenantId }, 'Failed to fetch Allegro user info');
      throw error;
    }
  }

  // Health check
  async healthCheck(tenantId: string): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const userInfo = await this.getUserInfo(tenantId);
      return {
        status: 'healthy',
        details: {
          userId: userInfo.id,
          login: userInfo.login,
          environment: this.config.environment
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: (error as Error).message }
      };
    }
  }

  // Utility methods
  isTokenValid(tenantId: string): boolean {
    const tokens = this.tokens.get(tenantId);
    if (!tokens) return false;
    
    // Simple check - in production you'd want to check expiration time
    return !!tokens.access_token;
  }

  removeTokens(tenantId: string): void {
    this.tokens.delete(tenantId);
    this.logger.info({ tenantId }, 'Allegro tokens removed');
  }
} 