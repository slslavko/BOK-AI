import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';
import { Logger } from 'pino';

// Configuration for RAG system
export interface RAGConfig {
  qdrantUrl: string;
  openaiApiKey: string;
  ollamaUrl: string;
  similarityThreshold: number;
  maxTokens: number;
  temperature: number;
}

// Knowledge source reference
export interface KnowledgeSource {
  docId: string;
  title: string;
  chunk: string;
  score: number;
  metadata: Record<string, any>;
}

// AI response with grounding information
export interface GroundedResponse {
  response: string;
  confidence: number;
  sources: KnowledgeSource[];
  needsHuman: boolean;
  reasoning: string;
  costEstimate: number;
}

// Query classification for routing
export type QueryType = 'simple' | 'complex' | 'sensitive';

export class RAGEngine {
  private qdrant: QdrantClient;
  private openai: OpenAI;
  private logger: Logger;
  private config: RAGConfig;

  constructor(config: RAGConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    
    // Initialize Qdrant client
    this.qdrant = new QdrantClient({
      url: config.qdrantUrl,
      apiKey: process.env.QDRANT_API_KEY,
    });

    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });

    this.logger.info('RAG Engine initialized');
  }

  /**
   * Main method to generate grounded AI response
   */
  async generateGroundedResponse(
    query: string,
    tenantId: string,
    context?: {
      conversationHistory?: Array<{role: string, content: string}>;
      customerData?: Record<string, any>;
      platform?: string;
    }
  ): Promise<GroundedResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.info({ query, tenantId }, 'Generating grounded response');

      // 1. Classify query to determine routing
      const queryType = await this.classifyQuery(query);
      
      // 2. Retrieve relevant knowledge from tenant's vector DB
      const relevantKnowledge = await this.retrieveKnowledge(query, tenantId);
      
      // 3. Check if we have sufficient knowledge
      if (!this.hasSufficientKnowledge(relevantKnowledge)) {
        return this.createFallbackResponse(query, relevantKnowledge);
      }

      // 4. Generate response based on query type
      let response: GroundedResponse;
      
      if (queryType === 'simple' && relevantKnowledge.length > 0) {
        // Use local AI for simple queries
        response = await this.generateLocalResponse(query, relevantKnowledge, tenantId);
      } else {
        // Use OpenAI for complex queries
        response = await this.generateOpenAIResponse(query, relevantKnowledge, tenantId, context);
      }

      // 5. Verify response is grounded in knowledge
      const isGrounded = await this.verifyGrounding(response.response, relevantKnowledge);
      
      if (!isGrounded) {
        this.logger.warn({ query, tenantId }, 'Response failed grounding verification');
        return this.createFallbackResponse(query, relevantKnowledge);
      }

      // 6. Calculate cost and performance metrics
      const processingTime = Date.now() - startTime;
      response.costEstimate = this.calculateCost(queryType, response.response.length);
      
      this.logger.info({
        tenantId,
        queryType,
        confidence: response.confidence,
        sourcesCount: response.sources.length,
        processingTime,
        cost: response.costEstimate
      }, 'Grounded response generated successfully');

      return response;

    } catch (error) {
      this.logger.error({ error, query, tenantId }, 'RAG generation failed');
      
      return {
        response: "Przepraszam, wystąpił problem techniczny. Proszę spróbować ponownie lub skontaktować się z obsługą.",
        confidence: 0,
        sources: [],
        needsHuman: true,
        reasoning: "Technical error occurred",
        costEstimate: 0
      };
    }
  }

  /**
   * Classify query to determine processing route
   */
  private async classifyQuery(query: string): Promise<QueryType> {
    // Simple heuristics for now - can be enhanced with ML model
    const simplePatterns = [
      /godziny otwarcia/i,
      /kontakt/i,
      /adres/i,
      /telefon/i,
      /email/i,
      /dostawa/i,
      /zwrot/i,
      /reklamacja/i,
      /płatność/i
    ];

    const sensitivePatterns = [
      /rabat/i,
      /promocja/i,
      /cena/i,
      /koszt/i,
      /zwrot pieniędzy/i,
      /rekompensata/i,
      /odszkodowanie/i
    ];

    const queryLower = query.toLowerCase();
    
    if (sensitivePatterns.some(pattern => pattern.test(queryLower))) {
      return 'sensitive';
    }
    
    if (simplePatterns.some(pattern => pattern.test(queryLower))) {
      return 'simple';
    }
    
    return 'complex';
  }

  /**
   * Retrieve relevant knowledge from vector database
   */
  private async retrieveKnowledge(
    query: string, 
    tenantId: string,
    limit: number = 5
  ): Promise<KnowledgeSource[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Search in tenant-specific collection
      const searchResult = await this.qdrant.search(`tenant_${tenantId}`, {
        vector: queryEmbedding,
        limit,
        score_threshold: this.config.similarityThreshold,
        with_payload: true,
        with_vector: false
      });

      // Transform results to KnowledgeSource format
      const sources: KnowledgeSource[] = searchResult.map(result => ({
        docId: result.payload?.doc_id as string,
        title: result.payload?.title as string,
        chunk: result.payload?.content as string,
        score: result.score,
        metadata: result.payload?.metadata as Record<string, any> || {}
      }));

      this.logger.debug({
        tenantId,
        query,
        sourcesFound: sources.length,
        topScore: sources[0]?.score
      }, 'Knowledge retrieved');

      return sources;

    } catch (error) {
      this.logger.error({ error, tenantId, query }, 'Knowledge retrieval failed');
      return [];
    }
  }

  /**
   * Generate embedding using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error({ error, text: text.substring(0, 100) }, 'Embedding generation failed');
      throw error;
    }
  }

  /**
   * Check if we have sufficient knowledge to answer
   */
  private hasSufficientKnowledge(sources: KnowledgeSource[]): boolean {
    if (sources.length === 0) return false;
    
    // Check if top result meets minimum confidence threshold
    const topScore = sources[0].score;
    return topScore >= this.config.similarityThreshold;
  }

  /**
   * Generate response using local AI (Ollama)
   */
  private async generateLocalResponse(
    query: string,
    sources: KnowledgeSource[],
    tenantId: string
  ): Promise<GroundedResponse> {
    try {
      const prompt = this.buildGroundedPrompt(query, sources, 'local');
      
      // Call Ollama API
      const response = await fetch(`${this.config.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.1:8b',
          prompt,
          stream: false,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens,
            stop: ['PYTANIE:', 'WIEDZA:', 'KONIEC']
          }
        })
      });

      const result = await response.json();
      
      return {
        response: result.response.trim(),
        confidence: sources[0].score,
        sources,
        needsHuman: false,
        reasoning: 'Local AI response based on knowledge base',
        costEstimate: 0 // Local AI is free
      };

    } catch (error) {
      this.logger.error({ error, tenantId }, 'Local AI generation failed');
      throw error;
    }
  }

  /**
   * Generate response using OpenAI
   */
  private async generateOpenAIResponse(
    query: string,
    sources: KnowledgeSource[],
    tenantId: string,
    context?: any
  ): Promise<GroundedResponse> {
    try {
      const prompt = this.buildGroundedPrompt(query, sources, 'openai', context);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Jesteś profesjonalnym asystentem sprzedażowym. Odpowiadaj TYLKO na podstawie podanej wiedzy. Jeśli nie masz informacji, powiedz że nie wiesz i przekieruj do człowieka.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stop: ['PYTANIE:', 'WIEDZA:', 'KONIEC']
      });

      const responseText = response.choices[0].message.content || '';
      
      return {
        response: responseText.trim(),
        confidence: sources[0].score,
        sources,
        needsHuman: false,
        reasoning: 'OpenAI response based on knowledge base',
        costEstimate: this.calculateOpenAICost(response.usage)
      };

    } catch (error) {
      this.logger.error({ error, tenantId }, 'OpenAI generation failed');
      throw error;
    }
  }

  /**
   * Build grounded prompt with anti-hallucination instructions
   */
  private buildGroundedPrompt(
    query: string,
    sources: KnowledgeSource[],
    aiType: 'local' | 'openai',
    context?: any
  ): string {
    const knowledgeContext = sources
      .map(source => `[${source.title}]: ${source.chunk}`)
      .join('\n\n');

    const conversationContext = context?.conversationHistory
      ? `\nKONTEKST ROZMOWY:\n${context.conversationHistory
          .slice(-3) // Last 3 messages
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n')}`
      : '';

    return `WAŻNE INSTRUKCJE:
- Odpowiadaj WYŁĄCZNIE na podstawie podanej WIEDZY FIRMY
- Jeśli nie masz dokładnej informacji, powiedz "Nie mam tej informacji. Przekieruj to pytanie do naszego konsultanta"
- NIE WYMYŚLAJ żadnych szczegółów, cen, terminów, procedur
- Bądź pomocny, ale tylko w ramach dostępnej wiedzy
- Odpowiadaj po polsku, w przyjaznym tonie

WIEDZA FIRMY:
${knowledgeContext}
${conversationContext}

PYTANIE KLIENTA: ${query}

ODPOWIEDŹ (tylko na podstawie wiedzy powyżej):`;
  }

  /**
   * Verify that response is grounded in provided knowledge
   */
  private async verifyGrounding(
    response: string,
    sources: KnowledgeSource[]
  ): Promise<boolean> {
    // Simple verification - check if response contains key terms from sources
    const sourceTerms = sources
      .flatMap(source => source.chunk.toLowerCase().split(/\s+/))
      .filter(term => term.length > 3)
      .slice(0, 20); // Top 20 terms

    const responseLower = response.toLowerCase();
    const matchingTerms = sourceTerms.filter(term => 
      responseLower.includes(term)
    ).length;

    // Response should contain at least 20% of source terms
    const groundingScore = matchingTerms / Math.max(sourceTerms.length, 1);
    
    this.logger.debug({
      groundingScore,
      matchingTerms,
      sourceTerms: sourceTerms.length
    }, 'Grounding verification');

    return groundingScore >= 0.2;
  }

  /**
   * Create fallback response when knowledge is insufficient
   */
  private createFallbackResponse(
    query: string,
    sources: KnowledgeSource[]
  ): GroundedResponse {
    const hasPartialKnowledge = sources.length > 0;
    
    let response = "Nie mam wystarczających informacji, aby odpowiedzieć na to pytanie. ";
    
    if (hasPartialKnowledge) {
      response += "Znalazłem podobne informacje, ale wolę przekierować Cię do naszego konsultanta, który udzieli dokładnej odpowiedzi. ";
    }
    
    response += "Czy mogę Cię z nim połączyć?";

    return {
      response,
      confidence: 0,
      sources,
      needsHuman: true,
      reasoning: hasPartialKnowledge ? 'Insufficient knowledge confidence' : 'No relevant knowledge found',
      costEstimate: 0
    };
  }

  /**
   * Calculate cost for different AI providers
   */
  private calculateCost(queryType: QueryType, responseLength: number): number {
    const exchangeRate = 4.5; // USD to PLN
    
    if (queryType === 'simple') {
      return 0; // Local AI is free
    }
    
    // OpenAI GPT-3.5-turbo pricing (approximate)
    const inputTokens = 100; // Estimated
    const outputTokens = Math.ceil(responseLength / 4); // ~4 chars per token
    
    const inputCost = (inputTokens / 1000) * 0.002 * exchangeRate;
    const outputCost = (outputTokens / 1000) * 0.002 * exchangeRate;
    
    return inputCost + outputCost;
  }

  /**
   * Calculate OpenAI cost from usage data
   */
  private calculateOpenAICost(usage: any): number {
    if (!usage) return 0;
    
    const exchangeRate = 4.5;
    const inputCost = (usage.prompt_tokens / 1000) * 0.002 * exchangeRate;
    const outputCost = (usage.completion_tokens / 1000) * 0.002 * exchangeRate;
    
    return inputCost + outputCost;
  }

  /**
   * Add knowledge document to tenant's vector database
   */
  async addKnowledgeDocument(
    tenantId: string,
    docId: string,
    title: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Split content into chunks
      const chunks = this.splitIntoChunks(content, 500);
      
      // Generate embeddings for each chunk
      const points = await Promise.all(
        chunks.map(async (chunk, index) => {
          const embedding = await this.generateEmbedding(chunk);
          
          return {
            id: `${docId}_chunk_${index}`,
            vector: embedding,
            payload: {
              doc_id: docId,
              title,
              content: chunk,
              chunk_index: index,
              metadata
            }
          };
        })
      );

      // Ensure collection exists
      await this.ensureCollection(tenantId);
      
      // Insert points into Qdrant
      await this.qdrant.upsert(`tenant_${tenantId}`, {
        wait: true,
        points
      });

      this.logger.info({
        tenantId,
        docId,
        chunksCreated: chunks.length
      }, 'Knowledge document added to vector database');

    } catch (error) {
      this.logger.error({ error, tenantId, docId }, 'Failed to add knowledge document');
      throw error;
    }
  }

  /**
   * Ensure tenant collection exists in Qdrant
   */
  private async ensureCollection(tenantId: string): Promise<void> {
    const collectionName = `tenant_${tenantId}`;
    
    try {
      await this.qdrant.getCollection(collectionName);
    } catch (error) {
      // Collection doesn't exist, create it
      await this.qdrant.createCollection(collectionName, {
        vectors: {
          size: 1536, // text-embedding-3-small dimension
          distance: 'Cosine'
        },
        optimizers_config: {
          default_segment_number: 2
        },
        replication_factor: 1
      });
      
      this.logger.info({ tenantId }, 'Created new tenant collection in Qdrant');
    }
  }

  /**
   * Split text into chunks for embedding
   */
  private splitIntoChunks(text: string, maxChunkSize: number): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence.trim();
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter(chunk => chunk.length > 10); // Filter out very short chunks
  }

  /**
   * Health check for RAG system
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      // Test Qdrant connection
      const qdrantHealth = await this.qdrant.api('cluster').clusterStatus();
      
      // Test OpenAI connection (simple embedding)
      await this.generateEmbedding('test');
      
      // Test Ollama connection
      const ollamaResponse = await fetch(`${this.config.ollamaUrl}/api/tags`);
      const ollamaHealthy = ollamaResponse.ok;

      return {
        status: 'healthy',
        details: {
          qdrant: 'connected',
          openai: 'connected',
          ollama: ollamaHealthy ? 'connected' : 'disconnected'
        }
      };
    } catch (error) {
      this.logger.error({ error }, 'RAG health check failed');
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }
} 