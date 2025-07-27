# 🚀 BOK-AI Enterprise Implementation Plan

## 📋 Overview

Kompletny plan przekształcenia BOK-AI w platformę enterprise obsługującą setki/tysiące klientów po 40 zł/miesiąc z pełną izolacją danych i lokalnym AI.

## 🎯 Business Requirements

- **Skala**: Setki/tysiące kont
- **Wolumen**: 20 wiadomości/dzień per klient
- **Latencja**: <3 sekundy odpowiedzi
- **Baza wiedzy**: Do 50 dokumentów per klient
- **Platformy**: Allegro, Amazon, OLX, eMAG
- **Budżet**: 40 zł/user z zyskiem

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Infrastructure │
│   (Next.js)     │◄──►│   (Fastify)     │◄──►│   (Self-hosted)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth System   │    │   AI Engine     │    │   Database      │
│   (JWT + Redis) │    │   (Local + API) │    │   (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Multi-tenant  │    │   Vector Store  │    │   Queue System  │
│   Isolation     │    │   (ChromaDB)    │    │   (Bull + Redis)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 Cost Analysis

### Monthly Costs per 1000 Users (40 zł/user = 40,000 zł revenue)

| Component | Cost/Month | Cost/User | Notes |
|-----------|------------|-----------|-------|
| **Infrastructure** | 2,000 zł | 2 zł | Hetzner Cloud AX41 (4x) |
| **Database** | 500 zł | 0.5 zł | PostgreSQL + Redis |
| **AI Local** | 0 zł | 0 zł | Mistral 7B on VPS |
| **AI Cloud** | 3,000 zł | 3 zł | OpenAI for 15% queries |
| **Vector Store** | 0 zł | 0 zł | ChromaDB local |
| **Monitoring** | 500 zł | 0.5 zł | Grafana + Prometheus |
| **CDN/Storage** | 1,000 zł | 1 zł | MinIO S3 compatible |
| **Total** | **7,000 zł** | **7 zł** | **33 zł profit per user** |

## 🗂️ Database Schema (Multi-Tenant)

### Core Tables

```sql
-- Users table (global)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tenants table (organizations)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    subscription_status VARCHAR(50) DEFAULT 'active',
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User-Tenant relationships
CREATE TABLE user_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- owner, admin, member
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- Conversations (tenant-isolated)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- allegro, amazon, olx
    platform_conversation_id VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    last_message_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, platform, platform_conversation_id)
);

-- Messages (tenant-isolated)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    platform_message_id VARCHAR(255),
    content TEXT NOT NULL,
    sender_type VARCHAR(50) NOT NULL, -- customer, bot
    sender_name VARCHAR(255),
    attachments JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Base (tenant-isolated)
CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    file_path VARCHAR(500),
    file_type VARCHAR(50),
    embedding_id VARCHAR(255), -- ChromaDB ID
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Models Configuration (tenant-isolated)
CREATE TABLE ai_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    model_type VARCHAR(50) NOT NULL, -- local, gpt35, gpt4
    model_name VARCHAR(100) NOT NULL,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    system_prompt TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage Tracking (tenant-isolated)
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- message_sent, ai_query, file_upload
    model_used VARCHAR(100),
    tokens_used INTEGER,
    cost DECIMAL(10,6),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Row Level Security (RLS)

```sql
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
```

## 🔐 Authentication & Authorization

### JWT Token Structure

```typescript
interface JWTPayload {
  userId: string;
  tenantId: string;
  role: 'owner' | 'admin' | 'member';
  permissions: string[];
  exp: number;
  iat: number;
}
```

### Middleware Implementation

```typescript
// backend/src/middleware/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { redis } from '../config/redis';

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
```

## 🤖 AI Engine Architecture

### Hybrid AI Strategy

```typescript
// backend/src/services/ai/ai-engine.ts
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

class AIEngine {
  private async selectModel(query: string, tenantId: string): Promise<string> {
    // Simple heuristics for model selection
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

  async generateResponse(
    query: string, 
    context: string[], 
    tenantId: string
  ): Promise<AIResponse> {
    const model = await this.selectModel(query, tenantId);
    
    switch (model) {
      case 'local':
        return await this.localModel(query, context);
      case 'gpt35':
        return await this.openAIModel(query, context, 'gpt-3.5-turbo');
      case 'gpt4mini':
        return await this.openAIModel(query, context, 'gpt-4-mini');
    }
  }
}
```

### RAG Implementation

```typescript
// backend/src/services/ai/rag-engine.ts
import { ChromaClient } from 'chromadb';

class RAGEngine {
  private chroma: ChromaClient;
  
  constructor() {
    this.chroma = new ChromaClient({
      path: 'http://localhost:8000'
    });
  }

  async addToKnowledgeBase(
    content: string, 
    metadata: any, 
    tenantId: string
  ): Promise<void> {
    const collection = await this.getTenantCollection(tenantId);
    
    // Generate embeddings
    const embedding = await this.generateEmbedding(content);
    
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
    const queryEmbedding = await this.generateEmbedding(query);
    
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
```

## 🔄 Queue System

### Bull Queue Implementation

```typescript
// backend/src/services/queue/queue-manager.ts
import Queue from 'bull';
import { redis } from '../config/redis';

export class QueueManager {
  private messageQueue: Queue;
  private aiQueue: Queue;
  private webhookQueue: Queue;

  constructor() {
    this.messageQueue = new Queue('message-processing', {
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT!),
        password: process.env.REDIS_PASSWORD
      }
    });

    this.aiQueue = new Queue('ai-processing', {
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT!),
        password: process.env.REDIS_PASSWORD
      }
    });

    this.webhookQueue = new Queue('webhook-processing', {
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT!),
        password: process.env.REDIS_PASSWORD
      }
    });

    this.setupProcessors();
  }

  private setupProcessors() {
    // Process incoming messages
    this.messageQueue.process(async (job) => {
      const { message, tenantId } = job.data;
      
      // Store message in database
      await this.storeMessage(message, tenantId);
      
      // Trigger AI processing
      await this.aiQueue.add({
        messageId: message.id,
        tenantId,
        content: message.content
      });
    });

    // Process AI responses
    this.aiQueue.process(async (job) => {
      const { messageId, tenantId, content } = job.data;
      
      // Get context from RAG
      const context = await this.ragEngine.searchKnowledgeBase(content, tenantId);
      
      // Generate AI response
      const response = await this.aiEngine.generateResponse(content, context, tenantId);
      
      // Send response to platform
      await this.sendToPlatform(response, tenantId);
      
      // Log usage
      await this.logUsage(tenantId, response);
    });
  }
}
```

## 📊 Monitoring & Analytics

### Cost Tracking

```typescript
// backend/src/services/monitoring/cost-tracker.ts
class CostTracker {
  async trackUsage(tenantId: string, usage: UsageData): Promise<void> {
    const cost = this.calculateCost(usage);
    
    await this.db.query(`
      INSERT INTO usage_logs (tenant_id, action, model_used, tokens_used, cost)
      VALUES ($1, $2, $3, $4, $5)
    `, [tenantId, usage.action, usage.model, usage.tokens, cost]);
    
    // Check if tenant exceeded budget
    await this.checkBudgetLimit(tenantId);
  }

  private calculateCost(usage: UsageData): number {
    const rates = {
      'gpt-3.5-turbo': 0.002,
      'gpt-4-mini': 0.02,
      'mistral:7b': 0
    };
    
    return rates[usage.model] * (usage.tokens / 1000);
  }

  async getTenantUsage(tenantId: string, period: string): Promise<UsageReport> {
    const result = await this.db.query(`
      SELECT 
        SUM(cost) as total_cost,
        COUNT(*) as total_requests,
        model_used,
        DATE(created_at) as date
      FROM usage_logs 
      WHERE tenant_id = $1 
      AND created_at >= NOW() - INTERVAL '1 $2'
      GROUP BY model_used, DATE(created_at)
      ORDER BY date DESC
    `, [tenantId, period]);
    
    return result.rows;
  }
}
```

## 🚀 Implementation Steps

### Phase 1: Foundation (Week 1-2)

1. **Database Setup**
   - Install PostgreSQL with RLS
   - Create schema with all tables
   - Set up migrations with Drizzle ORM
   - Test multi-tenant isolation

2. **Authentication System**
   - Implement JWT with refresh tokens
   - Create auth middleware
   - Set up Redis for session management
   - Test tenant isolation

3. **Basic API Structure**
   - Update existing endpoints for multi-tenant
   - Add tenant context to all requests
   - Implement proper error handling

### Phase 2: AI Engine (Week 3-4)

1. **Local AI Setup**
   - Install Ollama with Mistral 7B
   - Create AI engine with model selection
   - Implement basic RAG with ChromaDB
   - Test response quality and speed

2. **Cost Optimization**
   - Implement usage tracking
   - Create budget limits per tenant
   - Add cost monitoring dashboard
   - Optimize model selection logic

### Phase 3: Platform Integration (Week 5-6)

1. **Queue System**
   - Set up Bull queues with Redis
   - Implement message processing pipeline
   - Add webhook handling for platforms
   - Test scalability

2. **Platform APIs**
   - Extend Allegro integration
   - Add Amazon API integration
   - Add OLX API integration
   - Implement unified message format

### Phase 4: Production Ready (Week 7-8)

1. **Monitoring & Analytics**
   - Set up Grafana dashboards
   - Implement alerting system
   - Add performance monitoring
   - Create admin dashboard

2. **Security & Testing**
   - Security audit of multi-tenant isolation
   - Load testing with realistic data
   - Penetration testing
   - Performance optimization

## 🔧 Development Commands

```bash
# Database setup
npm run db:migrate
npm run db:seed

# AI setup
npm run ai:setup
npm run ai:test

# Development
npm run dev
npm run dev:backend

# Testing
npm run test
npm run test:e2e

# Production
npm run build
npm run start:prod
```

## 📈 Success Metrics

- **Cost per user**: <7 zł/month
- **Response time**: <3 seconds
- **Uptime**: >99.9%
- **Data isolation**: 100% (no cross-tenant data leaks)
- **AI accuracy**: >90% (measured by user satisfaction)

## 🎯 Next Steps

1. **Review and approve** this implementation plan
2. **Set up development environment** with PostgreSQL and Redis
3. **Start with Phase 1** - Database and Authentication
4. **Create feature branches** for each component
5. **Implement and test** each phase incrementally

---

**Ready to start implementation? Let's begin with Phase 1! 🚀** 