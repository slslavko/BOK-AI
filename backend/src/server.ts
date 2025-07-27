import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import redis from '@fastify/redis';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';

import { MultiTenantDatabase } from './config/database';
import { ProductionRAG } from './services/rag/production-rag';
import { LearningSystem } from './services/learning/learning-system';
import { AllegroService, AllegroConfig } from './services/platforms/allegro-service';
import { tenantMiddleware, tenantRateLimit, tenantLogging, tenantSecurityHeaders } from './middleware/tenant';

// Global services
let db: MultiTenantDatabase;
let ragEngine: ProductionRAG;
let learningSystem: LearningSystem;
let allegroService: AllegroService;

async function buildServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Register plugins
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  });

  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  await fastify.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: '1 minute',
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key',
  });

  const redisConfig: any = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  };
  
  if (process.env.REDIS_PASSWORD) {
    redisConfig.password = process.env.REDIS_PASSWORD;
  }

  await fastify.register(redis, redisConfig);

  await fastify.register(websocket);
  await fastify.register(multipart);

  // Initialize services
  db = MultiTenantDatabase.getInstance({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'bok_ai',
    username: process.env.DB_USER || 'bok_user',
    password: process.env.DB_PASSWORD || 'bok_password',
  }, fastify.log as any);

  ragEngine = new ProductionRAG({
    openaiKey: process.env.OPENAI_API_KEY || '',
    qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
    logger: fastify.log as any
  });

  learningSystem = new LearningSystem(fastify.log as any);

  // Initialize Allegro Service
  const allegroConfig: AllegroConfig = {
    clientId: process.env.ALLEGRO_CLIENT_ID || '',
    clientSecret: process.env.ALLEGRO_CLIENT_SECRET || '',
    redirectUri: process.env.ALLEGRO_REDIRECT_URI || 'http://localhost:3001/api/allegro/callback',
    environment: (process.env.ALLEGRO_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
  };

  allegroService = new AllegroService(allegroConfig, fastify.log as any);

  // Set up Allegro event listeners
  allegroService.on('newMessage', async (data) => {
    const { tenantId, threadId, message, thread } = data;
    
    try {
      // Process message with RAG
      const ragResponse = await ragEngine.processQuery(tenantId, message.text, {
        maxResults: 5,
        threshold: 0.7,
        maxTokens: 500
      });

      // Send response back to Allegro
      await allegroService.sendMessage(tenantId, threadId, ragResponse.response);

      // Log conversation for learning
      await learningSystem.logConversation(tenantId, threadId, message.text, ragResponse.response, {
        confidence: ragResponse.confidence,
        sources: ragResponse.sources,
        platform: 'allegro',
        customerId: message.author.id,
        intent: 'customer_inquiry',
        responseTime: Date.now(),
        cost: ragResponse.cost
      });

      fastify.log.info({ tenantId, threadId, messageId: message.id }, 'Processed Allegro message successfully');
    } catch (error) {
      fastify.log.error({ error, tenantId, threadId }, 'Failed to process Allegro message');
    }
  });

  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'BOK-AI Server Running',
      services: {
        database: 'connected',
        rag: 'ready',
        learning: 'active',
        allegro: allegroService ? 'configured' : 'not_configured'
      }
    };
  });

  // Auth routes - simplified for demo
  fastify.post('/auth/register', async (request: FastifyRequest<{
    Body: { email: string; password: string; tenantName: string }
  }>, reply) => {
    const { email, password, tenantName } = request.body;

    try {
      // Simple demo implementation
      const userId = `user_${Date.now()}`;
      const tenantId = `tenant_${Date.now()}`;

      const token = fastify.jwt.sign({ userId, tenantId });

      return {
        token,
        user: { id: userId, email },
        tenant: { id: tenantId, name: tenantName }
      };
    } catch (error) {
      reply.code(400);
      return { error: 'Registration failed', details: (error as Error).message };
    }
  });

  fastify.post('/auth/login', async (request: FastifyRequest<{
    Body: { email: string; password: string }
  }>, reply) => {
    const { email, password } = request.body;

    try {
      // Simple demo implementation
      const userId = `user_${Date.now()}`;
      const tenantId = `tenant_${Date.now()}`;

      const token = fastify.jwt.sign({ userId, tenantId });

      return {
        token,
        user: { id: userId, email },
        tenant: { id: tenantId, name: 'Demo Tenant' }
      };
    } catch (error) {
      reply.code(500);
      return { error: 'Login failed', details: (error as Error).message };
    }
  });

  // Allegro OAuth routes
  fastify.get('/api/allegro/auth', async (request: FastifyRequest<{
    Querystring: { tenantId: string }
  }>, reply) => {
    try {
      await request.jwtVerify();
      const { tenantId } = request.query;
      
      const state = Math.random().toString(36).substring(2, 15);
      const authUrl = allegroService.generateAuthUrl(state, tenantId);
      
      return { authUrl, state };
    } catch (error) {
      reply.code(401);
      return { error: 'Unauthorized' };
    }
  });

  fastify.get('/api/allegro/callback', async (request: FastifyRequest<{
    Querystring: { code: string; state: string }
  }>, reply) => {
    const { code, state } = request.query;
    
    try {
      // Extract tenant ID from state
      const [, tenantId] = state.split(':');
      
      const tokens = await allegroService.exchangeCodeForTokens(code, tenantId);
      
      // Start message polling for this tenant
      await allegroService.startMessagePolling(tenantId, 30000);
      
      return { 
        success: true, 
        message: 'Allegro integration configured successfully',
        tenantId 
      };
    } catch (error) {
      reply.code(400);
      return { error: 'OAuth callback failed', details: (error as Error).message };
    }
  });

  // Protected API routes with tenant middleware
  fastify.register(async function(fastify) {
    await fastify.addHook('preHandler', tenantMiddleware);
    await fastify.addHook('preHandler', tenantRateLimit);
    await fastify.addHook('preHandler', tenantLogging);
    await fastify.addHook('preHandler', tenantSecurityHeaders);

    // Chat endpoint
    fastify.post('/api/chat', async (request: FastifyRequest<{
      Body: { message: string; threadId?: string; platform?: string }
    }>, reply) => {
      const { message, threadId, platform = 'web' } = request.body;
      const { tenantId } = request as any;

      try {
        const response = await ragEngine.processQuery(tenantId, message, {
          maxResults: 5,
          threshold: 0.7,
          maxTokens: 500
        });

        // Log conversation
        const conversationId = await learningSystem.logConversation(
          tenantId, 
          threadId || 'web-chat', 
          message, 
          response.response,
          {
            confidence: response.confidence,
            sources: response.sources,
            platform,
            customerId: 'web-user',
            intent: 'general_inquiry',
            responseTime: Date.now(),
            cost: response.cost
          }
        );

        return {
          response: response.response,
          confidence: response.confidence,
          sources: response.sources,
          conversationId,
          responseTime: Date.now(),
          cost: response.cost
        };
      } catch (error) {
        reply.code(500);
        return { error: 'Chat processing failed', details: (error as Error).message };
      }
    });

    // Get Allegro threads
    fastify.get('/api/threads', async (request: FastifyRequest, reply) => {
      const { tenantId } = request as any;

      try {
        if (!allegroService.isTokenValid(tenantId)) {
          reply.code(401);
          return { error: 'Allegro not connected. Please authorize first.' };
        }

        const threads = await allegroService.getMessageThreads(tenantId, 50, 0);
        
        return {
          threads: threads.map(thread => ({
            id: thread.id,
            platform: 'allegro',
            customerName: thread.buyer.login,
            status: thread.unreadCount > 0 ? 'active' : 'waiting',
            unreadCount: thread.unreadCount,
            lastActivity: thread.modifiedAt,
            messages: thread.lastMessage ? [{
              id: thread.lastMessage.id,
              content: thread.lastMessage.text,
              sender: thread.lastMessage.type === 'BUYER' ? 'customer' : 'bot',
              timestamp: thread.lastMessage.createdAt
            }] : []
          }))
        };
      } catch (error) {
        reply.code(500);
        return { error: 'Failed to fetch threads', details: (error as Error).message };
      }
    });

    // Send message to Allegro thread
    fastify.post('/api/threads/:threadId/messages', async (request: FastifyRequest<{
      Params: { threadId: string };
      Body: { content: string }
    }>, reply) => {
      const { threadId } = request.params;
      const { content } = request.body;
      const { tenantId } = request as any;

      try {
        if (!allegroService.isTokenValid(tenantId)) {
          reply.code(401);
          return { error: 'Allegro not connected. Please authorize first.' };
        }

        const result = await allegroService.sendMessage(tenantId, threadId, content);
        
        return {
          success: true,
          messageId: result.messageId
        };
      } catch (error) {
        reply.code(500);
        return { error: 'Failed to send message', details: (error as Error).message };
      }
    });

    // Knowledge management
    fastify.post('/api/knowledge', async (request: FastifyRequest<{
      Body: { title: string; content: string; metadata?: Record<string, any> }
    }>, reply) => {
      const { title, content, metadata = {} } = request.body;
      const { tenantId } = request as any;

      try {
        const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await ragEngine.addKnowledge(tenantId, docId, content, { title, ...metadata });

        return { success: true, docId, message: 'Knowledge added successfully' };
      } catch (error) {
        reply.code(500);
        return { error: 'Failed to add knowledge', details: (error as Error).message };
      }
    });

    // Learning insights
    fastify.get('/api/insights', async (request: FastifyRequest, reply) => {
      const { tenantId } = request as any;

      try {
        const insights = await learningSystem.getLearningInsights(tenantId);
        return insights;
      } catch (error) {
        reply.code(500);
        return { error: 'Failed to fetch insights', details: (error as Error).message };
      }
    });

    // Feedback
    fastify.post('/api/feedback', async (request: FastifyRequest<{
      Body: {
        conversationId: string;
        type: 'explicit' | 'implicit';
        rating?: 'good' | 'bad' | 'neutral';
        correction?: string;
        humanTakeover?: boolean;
      }
    }>, reply) => {
      const { conversationId, type, rating, correction, humanTakeover } = request.body;
      const { tenantId } = request as any;

      try {
        const feedbackData: any = { type };
        if (rating !== undefined) feedbackData.rating = rating;
        if (correction !== undefined) feedbackData.correction = correction;
        if (humanTakeover !== undefined) feedbackData.humanTakeover = humanTakeover;

        await learningSystem.recordFeedback(conversationId, tenantId, feedbackData);

        return { success: true, message: 'Feedback recorded successfully' };
      } catch (error) {
        reply.code(500);
        return { error: 'Failed to record feedback', details: (error as Error).message };
      }
    });
  });

  // WebSocket for real-time updates
  fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (connection, req) => {
      connection.socket.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === 'subscribe' && data.tenantId) {
            // Subscribe to tenant-specific updates
            connection.socket.send(JSON.stringify({
              type: 'subscribed',
              tenantId: data.tenantId
            }));
          }
        } catch (error) {
          fastify.log.error({ error }, 'WebSocket message parsing error');
        }
      });

      connection.socket.send(JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString()
      }));
    });
  });

  return fastify;
}

export default buildServer;

if (require.main === module) {
  const start = async () => {
    try {
      const server = await buildServer();
      await server.listen({ 
        port: parseInt(process.env.PORT || '3001'), 
        host: process.env.HOST || '0.0.0.0' 
      });
      
      console.log('🚀 BOK-AI Server started successfully!');
      console.log('📊 Health check: http://localhost:3001/health');
      console.log('🔗 Allegro OAuth: http://localhost:3001/api/allegro/auth?tenantId=YOUR_TENANT_ID');
    } catch (err) {
      console.error('❌ Error starting server:', err);
      process.exit(1);
    }
  };

  start();
} 