# 🤖 Cursor AI Implementation Guide - BOK-AI Enterprise

## 📋 Project Overview

**BOK-AI** to platforma automatyzacji obsługi klienta dla sprzedawców e-commerce w Polsce. Platforma integruje się z Allegro, Amazon, OLX i eMAG, automatycznie odpowiadając na wiadomości klientów przy użyciu AI.

### 🎯 Business Model
- **Cena:** 40 zł/miesiąc per użytkownik
- **Target:** Setki/tysiące sprzedawców w Polsce
- **Skala:** 20 wiadomości/dzień per klient
- **Platformy:** Allegro, Amazon, OLX, eMAG
- **Status:** Już sprzedajemy, brakuje aplikacji

### 🏗️ Current State
- ✅ **Frontend:** Next.js 15 z kompletnym UI
- ✅ **Backend:** Fastify z integracją Allegro API
- ✅ **Płatności:** System subskrypcji działa
- ✅ **Klienci:** Mamy już klientów
- ❌ **Multi-tenancy:** Brak izolacji danych
- ❌ **Baza danych:** Brak PostgreSQL
- ❌ **AI Engine:** Brak lokalnego AI + RAG
- ❌ **Autoryzacja:** Brak systemu logowania

## 🚀 Implementation Strategy

### Phase 1: Foundation (Database + Auth)
### Phase 2: AI Engine (Local + RAG)
### Phase 3: Platform Integration
### Phase 4: Production Ready

---

## 📊 Cost Analysis & Architecture

### Target: 1000 users = 40,000 zł revenue/month
### Max Cost: 7,000 zł/month = 7 zł/user
### Profit: 33 zł/user = 33,000 zł/month

### Infrastructure Stack:
- **Hosting:** Self-hosted (Hetzner Cloud AX41)
- **Database:** PostgreSQL 15 + Redis
- **AI Local:** Mistral 7B via Ollama
- **AI Cloud:** OpenAI (GPT-3.5-turbo, GPT-4-mini)
- **Vector Store:** ChromaDB (local)
- **Queue:** Bull + Redis
- **Storage:** MinIO (S3 compatible)

---

## 🗂️ Database Schema Implementation

### Step 1: Install Dependencies

```bash
cd backend
npm install drizzle-orm pg @types/pg
npm install -D drizzle-kit
```

### Step 2: Create Database Schema

```typescript
// backend/src/database/schema.ts
import { pgTable, uuid, varchar, timestamp, text, boolean, decimal, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (global)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tenants table (organizations)
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('active'),
  subscriptionPlan: varchar('subscription_plan', { length: 50 }).default('basic'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User-Tenant relationships
export const userTenants = pgTable('user_tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).default('member'), // owner, admin, member
  createdAt: timestamp('created_at').defaultNow(),
});

// Conversations (tenant-isolated)
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  platform: varchar('platform', { length: 50 }).notNull(), // allegro, amazon, olx
  platformConversationId: varchar('platform_conversation_id', { length: 255 }).notNull(),
  customerName: varchar('customer_name', { length: 255 }),
  status: varchar('status', { length: 50 }).default('active'),
  lastMessageAt: timestamp('last_message_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Messages (tenant-isolated)
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }),
  platformMessageId: varchar('platform_message_id', { length: 255 }),
  content: text('content').notNull(),
  senderType: varchar('sender_type', { length: 50 }).notNull(), // customer, bot
  senderName: varchar('sender_name', { length: 255 }),
  attachments: jsonb('attachments'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Knowledge Base (tenant-isolated)
export const knowledgeBase = pgTable('knowledge_base', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  filePath: varchar('file_path', { length: 500 }),
  fileType: varchar('file_type', { length: 50 }),
  embeddingId: varchar('embedding_id', { length: 255 }), // ChromaDB ID
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// AI Models Configuration (tenant-isolated)
export const aiConfigs = pgTable('ai_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  modelType: varchar('model_type', { length: 50 }).notNull(), // local, gpt35, gpt4
  modelName: varchar('model_name', { length: 100 }).notNull(),
  temperature: decimal('temperature', { precision: 3, scale: 2 }).default('0.7'),
  maxTokens: integer('max_tokens').default(1000),
  systemPrompt: text('system_prompt'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Usage Tracking (tenant-isolated)
export const usageLogs = pgTable('usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(), // message_sent, ai_query, file_upload
  modelUsed: varchar('model_used', { length: 100 }),
  tokensUsed: integer('tokens_used'),
  cost: decimal('cost', { precision: 10, scale: 6 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userTenants: many(userTenants),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  userTenants: many(userTenants),
  conversations: many(conversations),
  messages: many(messages),
  knowledgeBase: many(knowledgeBase),
  aiConfigs: many(aiConfigs),
  usageLogs: many(usageLogs),
}));
```

### Step 3: Database Configuration

```typescript
// backend/src/database/config.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'bok_ai',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });

// Row Level Security setup
export async function setupRLS() {
  await pool.query(`
    -- Enable RLS on all tenant tables
    ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
    ALTER TABLE ai_configs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

    -- RLS Policies
    CREATE POLICY tenant_isolation_conversations ON conversations
      FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

    CREATE POLICY tenant_isolation_messages ON messages
      FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

    CREATE POLICY tenant_isolation_knowledge ON knowledge_base
      FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

    CREATE POLICY tenant_isolation_ai_configs ON ai_configs
      FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

    CREATE POLICY tenant_isolation_usage ON usage_logs
      FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
  `);
}
```

### Step 4: Migration Script

```typescript
// backend/src/database/migrate.ts
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './config';

async function runMigrations() {
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
```

---

## 🔐 Authentication System Implementation

### Step 1: Install Auth Dependencies

```bash
cd backend
npm install bcryptjs jsonwebtoken
npm install @types/bcryptjs @types/jsonwebtoken
```

### Step 2: Auth Service

```typescript
// backend/src/services/auth/auth-service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../database/config';
import { users, tenants, userTenants } from '../../database/schema';
import { eq, and } from 'drizzle-orm';

export interface JWTPayload {
  userId: string;
  tenantId: string;
  role: 'owner' | 'admin' | 'member';
  permissions: string[];
  exp: number;
  iat: number;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET!;
  private readonly JWT_EXPIRES_IN = '24h';
  private readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  async registerUser(email: string, password: string, tenantName: string) {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const [user] = await db.insert(users).values({
      email,
      passwordHash,
    }).returning();

    // Create tenant
    const [tenant] = await db.insert(tenants).values({
      name: tenantName,
      slug: this.generateSlug(tenantName),
    }).returning();

    // Create user-tenant relationship (owner)
    await db.insert(userTenants).values({
      userId: user.id,
      tenantId: tenant.id,
      role: 'owner',
    });

    return { user, tenant };
  }

  async loginUser(email: string, password: string, tenantId?: string) {
    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      with: {
        userTenants: {
          with: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // If tenantId provided, verify user has access
    let userTenant = user.userTenants[0];
    if (tenantId) {
      userTenant = user.userTenants.find(ut => ut.tenantId === tenantId);
      if (!userTenant) {
        throw new Error('Access denied to this tenant');
      }
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, userTenant.tenantId, userTenant.role);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: userTenant.role,
        tenant: userTenant.tenant,
      },
    };
  }

  private generateAccessToken(userId: string, tenantId: string, role: string): string {
    return jwt.sign(
      {
        userId,
        tenantId,
        role,
        permissions: this.getPermissionsForRole(role),
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      this.JWT_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
    );
  }

  private getPermissionsForRole(role: string): string[] {
    switch (role) {
      case 'owner':
        return ['read', 'write', 'delete', 'admin', 'billing'];
      case 'admin':
        return ['read', 'write', 'delete', 'admin'];
      case 'member':
        return ['read', 'write'];
      default:
        return ['read'];
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
```

### Step 3: Auth Middleware

```typescript
// backend/src/middleware/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { redis } from '../config/redis';
import { JWTPayload } from '../services/auth/auth-service';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
    tenantId?: string;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return reply.code(401).send({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return reply.code(401).send({ error: 'Token blacklisted' });
    }

    // Set tenant context for RLS
    request.user = decoded;
    request.tenantId = decoded.tenantId;
    
    // Set PostgreSQL session variable for RLS
    await request.server.pg.query(
      `SET app.current_tenant_id = '${decoded.tenantId}'`
    );
    
  } catch (error) {
    return reply.code(401).send({ error: 'Invalid token' });
  }
}

export async function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    if (!roles.includes(request.user.role)) {
      return reply.code(403).send({ error: 'Insufficient permissions' });
    }
  };
}
```

---

## 🤖 AI Engine Implementation

### Step 1: Install AI Dependencies

```bash
cd backend
npm install ollama chromadb @langchain/openai @langchain/community
```

### Step 2: AI Engine Service

```typescript
// backend/src/services/ai/ai-engine.ts
import { Ollama } from '@langchain/community/llms/ollama';
import { OpenAI } from '@langchain/openai';
import { CostTracker } from '../monitoring/cost-tracker';

interface AIStrategy {
  local: {
    model: 'mistral:7b';
    useFor: ['simple_questions', 'faq', 'greetings'];
    cost: 0;
    maxTokens: 1000;
  };
  gpt35: {
    model: 'gpt-3.5-turbo';
    useFor: ['complex_questions', 'negotiations'];
    cost: 0.002; // zł per request
    maxTokens: 2000;
  };
  gpt4mini: {
    model: 'gpt-4-mini';
    useFor: ['critical_cases', 'high_value_customers'];
    cost: 0.02; // zł per request
    maxTokens: 4000;
  };
}

export class AIEngine {
  private ollama: Ollama;
  private openai: OpenAI;
  private costTracker: CostTracker;

  constructor() {
    this.ollama = new Ollama({
      baseUrl: 'http://localhost:11434',
      model: 'mistral:7b',
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-3.5-turbo',
    });

    this.costTracker = new CostTracker();
  }

  async generateResponse(
    query: string, 
    context: string[], 
    tenantId: string,
    conversationHistory: string[] = []
  ): Promise<AIResponse> {
    const model = await this.selectModel(query, tenantId);
    const startTime = Date.now();

    try {
      let response: string;
      let tokensUsed: number = 0;

      switch (model) {
        case 'local':
          response = await this.localModel(query, context, conversationHistory);
          tokensUsed = this.estimateTokens(query + response);
          break;
        case 'gpt35':
          const gpt35Response = await this.openAIModel(query, context, conversationHistory, 'gpt-3.5-turbo');
          response = gpt35Response.content;
          tokensUsed = gpt35Response.usage?.total_tokens || 0;
          break;
        case 'gpt4mini':
          const gpt4Response = await this.openAIModel(query, context, conversationHistory, 'gpt-4-mini');
          response = gpt4Response.content;
          tokensUsed = gpt4Response.usage?.total_tokens || 0;
          break;
        default:
          throw new Error(`Unknown model: ${model}`);
      }

      const responseTime = Date.now() - startTime;

      // Log usage
      await this.costTracker.trackUsage(tenantId, {
        action: 'ai_query',
        model: model,
        tokens: tokensUsed,
        responseTime,
      });

      return {
        content: response,
        model,
        tokensUsed,
        responseTime,
        cost: this.calculateCost(model, tokensUsed),
      };

    } catch (error) {
      console.error('AI generation error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  private async selectModel(query: string, tenantId: string): Promise<string> {
    const complexity = this.analyzeComplexity(query);
    const tenantValue = await this.getTenantValue(tenantId);
    
    if (complexity === 'simple' && tenantValue === 'standard') {
      return 'local';
    } else if (complexity === 'complex' || tenantValue === 'premium') {
      return 'gpt35';
    } else {
      return 'gpt4mini';
    }
  }

  private analyzeComplexity(query: string): 'simple' | 'complex' {
    const simpleKeywords = ['cześć', 'hello', 'dziękuję', 'thanks', 'ok', 'dobrze'];
    const complexKeywords = ['reklamacja', 'complaint', 'zwrot', 'return', 'problem', 'issue'];
    
    const queryLower = query.toLowerCase();
    
    if (complexKeywords.some(keyword => queryLower.includes(keyword))) {
      return 'complex';
    }
    
    if (simpleKeywords.some(keyword => queryLower.includes(keyword))) {
      return 'simple';
    }
    
    return 'complex'; // Default to complex for safety
  }

  private async getTenantValue(tenantId: string): Promise<'standard' | 'premium'> {
    // TODO: Implement tenant value logic based on subscription plan
    return 'standard';
  }

  private async localModel(
    query: string, 
    context: string[], 
    conversationHistory: string[]
  ): Promise<string> {
    const prompt = this.buildPrompt(query, context, conversationHistory);
    
    const response = await this.ollama.invoke(prompt);
    return response;
  }

  private async openAIModel(
    query: string, 
    context: string[], 
    conversationHistory: string[],
    model: string
  ): Promise<any> {
    const prompt = this.buildPrompt(query, context, conversationHistory);
    
    const response = await this.openai.invoke(prompt, {
      model,
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    return response;
  }

  private buildPrompt(
    query: string, 
    context: string[], 
    conversationHistory: string[]
  ): string {
    const contextText = context.length > 0 
      ? `\n\nKontekst z bazy wiedzy:\n${context.join('\n\n')}` 
      : '';
    
    const historyText = conversationHistory.length > 0
      ? `\n\nHistoria rozmowy:\n${conversationHistory.join('\n')}`
      : '';

    return `Jesteś pomocnym asystentem obsługi klienta dla sklepu internetowego. 
Odpowiadaj profesjonalnie, ale przyjaźnie po polsku.
Maksymalnie 2-3 zdania w odpowiedzi.
${contextText}${historyText}

Klient: ${query}
Asystent:`;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private calculateCost(model: string, tokens: number): number {
    const rates = {
      'local': 0,
      'gpt-3.5-turbo': 0.002,
      'gpt-4-mini': 0.02,
    };
    
    return rates[model as keyof typeof rates] * (tokens / 1000);
  }
}

interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
  responseTime: number;
  cost: number;
}
```

### Step 3: RAG Engine

```typescript
// backend/src/services/ai/rag-engine.ts
import { ChromaClient } from 'chromadb';
import { OpenAIEmbeddings } from '@langchain/openai';

export class RAGEngine {
  private chroma: ChromaClient;
  private embeddings: OpenAIEmbeddings;
  
  constructor() {
    this.chroma = new ChromaClient({
      path: 'http://localhost:8000'
    });
    
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  async addToKnowledgeBase(
    content: string, 
    metadata: any, 
    tenantId: string
  ): Promise<void> {
    const collection = await this.getTenantCollection(tenantId);
    
    // Generate embeddings
    const embedding = await this.embeddings.embedQuery(content);
    
    await collection.add({
      embeddings: [embedding],
      documents: [content],
      metadatas: [metadata]
    });
  }

  async searchKnowledgeBase(
    query: string, 
    tenantId: string, 
    limit: number = 5
  ): Promise<SearchResult[]> {
    const collection = await this.getTenantCollection(tenantId);
    const queryEmbedding = await this.embeddings.embedQuery(query);
    
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit
    });
    
    return results.documents[0].map((doc, i) => ({
      content: doc,
      metadata: results.metadatas[0][i],
      distance: results.distances[0][i]
    }));
  }

  private async getTenantCollection(tenantId: string) {
    const collectionName = `tenant_${tenantId}`;
    
    try {
      return await this.chroma.getCollection({ name: collectionName });
    } catch {
      return await this.chroma.createCollection({ name: collectionName });
    }
  }
}

interface SearchResult {
  content: string;
  metadata: any;
  distance: number;
}
```

---

## 🔄 Queue System Implementation

### Step 1: Install Queue Dependencies

```bash
cd backend
npm install bull
```

### Step 2: Queue Manager

```typescript
// backend/src/services/queue/queue-manager.ts
import Queue from 'bull';
import { redis } from '../config/redis';
import { AIEngine } from '../ai/ai-engine';
import { RAGEngine } from '../ai/rag-engine';
import { db } from '../../database/config';
import { messages, conversations } from '../../database/schema';

export class QueueManager {
  private messageQueue: Queue;
  private aiQueue: Queue;
  private webhookQueue: Queue;
  private aiEngine: AIEngine;
  private ragEngine: RAGEngine;

  constructor() {
    this.messageQueue = new Queue('message-processing', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      }
    });

    this.aiQueue = new Queue('ai-processing', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      }
    });

    this.webhookQueue = new Queue('webhook-processing', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      }
    });

    this.aiEngine = new AIEngine();
    this.ragEngine = new RAGEngine();

    this.setupProcessors();
  }

  private setupProcessors() {
    // Process incoming messages
    this.messageQueue.process(async (job) => {
      const { message, tenantId } = job.data;
      
      // Store message in database
      await this.storeMessage(message, tenantId);
      
      // Trigger AI processing if message is from customer
      if (message.senderType === 'customer') {
        await this.aiQueue.add({
          messageId: message.id,
          tenantId,
          content: message.content,
          conversationId: message.conversationId,
        });
      }
    });

    // Process AI responses
    this.aiQueue.process(async (job) => {
      const { messageId, tenantId, content, conversationId } = job.data;
      
      try {
        // Get conversation history
        const history = await this.getConversationHistory(conversationId, tenantId);
        
        // Get context from RAG
        const context = await this.ragEngine.searchKnowledgeBase(content, tenantId);
        
        // Generate AI response
        const response = await this.aiEngine.generateResponse(
          content, 
          context.map(c => c.content), 
          tenantId,
          history
        );
        
        // Store AI response
        await this.storeMessage({
          conversationId,
          content: response.content,
          senderType: 'bot',
          senderName: 'BOK-AI',
          platformMessageId: `ai_${Date.now()}`,
        }, tenantId);
        
        // Send response to platform
        await this.sendToPlatform(response.content, conversationId, tenantId);
        
      } catch (error) {
        console.error('AI processing error:', error);
        // Log error but don't fail the job
      }
    });
  }

  private async storeMessage(message: any, tenantId: string) {
    await db.insert(messages).values({
      tenantId,
      conversationId: message.conversationId,
      platformMessageId: message.platformMessageId,
      content: message.content,
      senderType: message.senderType,
      senderName: message.senderName,
      attachments: message.attachments,
    });
  }

  private async getConversationHistory(conversationId: string, tenantId: string): Promise<string[]> {
    const history = await db.query.messages.findMany({
      where: and(
        eq(messages.conversationId, conversationId),
        eq(messages.tenantId, tenantId)
      ),
      orderBy: [asc(messages.createdAt)],
      limit: 10,
    });

    return history.map(msg => `${msg.senderType}: ${msg.content}`);
  }

  private async sendToPlatform(content: string, conversationId: string, tenantId: string) {
    // TODO: Implement platform-specific sending logic
    // This will integrate with Allegro, Amazon, OLX APIs
    console.log(`Sending to platform: ${content}`);
  }

  // Public methods for adding jobs
  async addMessage(message: any, tenantId: string) {
    await this.messageQueue.add({ message, tenantId });
  }

  async addWebhook(webhook: any, tenantId: string) {
    await this.webhookQueue.add({ webhook, tenantId });
  }
}
```

---

## 📊 Monitoring & Cost Tracking

### Step 1: Cost Tracker

```typescript
// backend/src/services/monitoring/cost-tracker.ts
import { db } from '../../database/config';
import { usageLogs } from '../../database/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

interface UsageData {
  action: string;
  model: string;
  tokens: number;
  responseTime?: number;
}

interface UsageReport {
  totalCost: number;
  totalRequests: number;
  modelUsed: string;
  date: string;
}

export class CostTracker {
  async trackUsage(tenantId: string, usage: UsageData): Promise<void> {
    const cost = this.calculateCost(usage);
    
    await db.insert(usageLogs).values({
      tenantId,
      action: usage.action,
      modelUsed: usage.model,
      tokensUsed: usage.tokens,
      cost,
    });
    
    // Check if tenant exceeded budget
    await this.checkBudgetLimit(tenantId);
  }

  private calculateCost(usage: UsageData): number {
    const rates = {
      'gpt-3.5-turbo': 0.002,
      'gpt-4-mini': 0.02,
      'mistral:7b': 0,
      'local': 0,
    };
    
    return rates[usage.model as keyof typeof rates] * (usage.tokens / 1000);
  }

  async getTenantUsage(tenantId: string, period: string = 'month'): Promise<UsageReport[]> {
    const startDate = this.getStartDate(period);
    
    const result = await db
      .select({
        totalCost: sql`SUM(cost)`,
        totalRequests: sql`COUNT(*)`,
        modelUsed: usageLogs.modelUsed,
        date: sql`DATE(created_at)`,
      })
      .from(usageLogs)
      .where(
        and(
          eq(usageLogs.tenantId, tenantId),
          gte(usageLogs.createdAt, startDate)
        )
      )
      .groupBy(usageLogs.modelUsed, sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at) DESC`);

    return result;
  }

  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  private async checkBudgetLimit(tenantId: string): Promise<void> {
    // TODO: Implement budget limit checking
    // This would check tenant's subscription plan and usage limits
  }
}
```

---

## 🔧 Environment Setup

### Step 1: Environment Variables

```bash
# backend/.env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=bok_ai

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Ollama
OLLAMA_HOST=http://localhost:11434

# ChromaDB
CHROMADB_HOST=http://localhost:8000

# Server
PORT=3001
NODE_ENV=development
```

### Step 2: Docker Compose for Development

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: bok_ai
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chromadb_data:/chroma/chroma

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

volumes:
  postgres_data:
  redis_data:
  chromadb_data:
  ollama_data:
```

### Step 3: Setup Scripts

```bash
# scripts/setup-dev.sh
#!/bin/bash

echo "🚀 Setting up BOK-AI development environment..."

# Start services
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Install Ollama models
echo "📥 Installing Ollama models..."
curl -X POST http://localhost:11434/api/pull -d '{"name": "mistral:7b"}'

# Run database migrations
echo "🗄️ Running database migrations..."
cd backend
npm run db:migrate

# Seed initial data
echo "🌱 Seeding initial data..."
npm run db:seed

echo "✅ Development environment ready!"
echo "📊 Services:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - ChromaDB: localhost:8000"
echo "  - Ollama: localhost:11434"
```

---

## 🚀 Implementation Checklist

### Phase 1: Foundation ✅
- [ ] Install PostgreSQL and Redis
- [ ] Create database schema with Drizzle ORM
- [ ] Implement Row Level Security (RLS)
- [ ] Create authentication service
- [ ] Implement JWT middleware
- [ ] Test multi-tenant isolation

### Phase 2: AI Engine ✅
- [ ] Install Ollama and Mistral 7B
- [ ] Set up ChromaDB for vector storage
- [ ] Implement AI engine with model selection
- [ ] Create RAG system
- [ ] Add cost tracking
- [ ] Test AI response quality

### Phase 3: Platform Integration ✅
- [ ] Set up Bull queues
- [ ] Implement message processing pipeline
- [ ] Extend Allegro integration
- [ ] Add Amazon API integration
- [ ] Add OLX API integration
- [ ] Test webhook handling

### Phase 4: Production Ready ✅
- [ ] Set up monitoring (Grafana)
- [ ] Implement alerting system
- [ ] Add performance monitoring
- [ ] Security audit
- [ ] Load testing
- [ ] Deployment automation

---

## 🎯 Success Criteria

- **Cost per user**: <7 zł/month ✅
- **Response time**: <3 seconds ✅
- **Uptime**: >99.9% ✅
- **Data isolation**: 100% (no cross-tenant leaks) ✅
- **AI accuracy**: >90% (user satisfaction) ✅

---

## 📞 Support & Next Steps

1. **Review this guide** thoroughly before starting
2. **Set up development environment** using the provided scripts
3. **Implement Phase 1** first - Database & Authentication
4. **Test each component** before moving to the next
5. **Create feature branches** for each major component
6. **Monitor costs** throughout development

**Ready to build the future of customer support automation! 🚀** 