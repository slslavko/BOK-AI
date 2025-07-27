import { Logger } from 'pino';
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';

// Data Processing (inspirowane Michałem)
export class DocumentProcessor {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  // Loader - różne źródła dokumentów
  async loadDocument(source: string, type: 'text' | 'pdf' | 'url'): Promise<string> {
    switch (type) {
      case 'text':
        return source;
      case 'pdf':
        // TODO: Implement PDF parsing
        return source;
      case 'url':
        // TODO: Implement web scraping
        return source;
      default:
        throw new Error(`Unsupported document type: ${type}`);
    }
  }

  // Chunker - inteligentne dzielenie
  chunkDocument(content: string, maxChunkSize: number = 500): string[] {
    // Polish-aware chunking
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
      if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedSentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter(chunk => chunk.length > 20); // Filter very short chunks
  }

  // Preprocessor - czyszczenie i normalizacja polskiego tekstu
  preprocessText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .replace(/[^\w\sąćęłńóśźżĄĆĘŁŃÓŚŹŻ.,!?-]/g, '') // Keep Polish chars
      .trim();
  }

  // Deduplication
  deduplicateChunks(chunks: string[]): string[] {
    const seen = new Set<string>();
    return chunks.filter(chunk => {
      const normalized = chunk.toLowerCase().replace(/\s+/g, ' ');
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  }
}

// Embedding System (inspirowane providers Michała)
export class EmbeddingSystem {
  private openai: OpenAI;
  private qdrant: QdrantClient;
  private logger: Logger;
  private cache: Map<string, number[]> = new Map(); // Simple in-memory cache

  constructor(openaiKey: string, qdrantUrl: string, logger: Logger) {
    this.openai = new OpenAI({ apiKey: openaiKey });
    this.qdrant = new QdrantClient({ url: qdrantUrl });
    this.logger = logger;
  }

  // Generate embeddings with caching
  async generateEmbedding(text: string): Promise<number[]> {
    const cacheKey = this.hashText(text);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small', // Cheapest option
        input: text,
        encoding_format: 'float'
      });

      const embedding = response.data[0].embedding;
      
      // Cache result
      this.cache.set(cacheKey, embedding);
      
      return embedding;
    } catch (error) {
      this.logger.error({ error, text: text.substring(0, 100) }, 'Embedding generation failed');
      throw error;
    }
  }

  // Store embeddings in Qdrant with tenant isolation
  async storeEmbeddings(
    tenantId: string,
    docId: string,
    chunks: string[],
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const collectionName = `tenant_${tenantId}`;
    
    // Ensure collection exists
    await this.ensureCollection(collectionName);

    // Generate embeddings for all chunks
    const points = await Promise.all(
      chunks.map(async (chunk, index) => {
        const embedding = await this.generateEmbedding(chunk);
        
        return {
          id: `${docId}_chunk_${index}`,
          vector: embedding,
          payload: {
            doc_id: docId,
            chunk_text: chunk,
            chunk_index: index,
            tenant_id: tenantId,
            ...metadata
          }
        };
      })
    );

    // Batch insert
    await this.qdrant.upsert(collectionName, {
      wait: true,
      points
    });

    this.logger.info({
      tenantId,
      docId,
      chunksStored: chunks.length
    }, 'Embeddings stored successfully');
  }

  private async ensureCollection(name: string): Promise<void> {
    try {
      await this.qdrant.getCollection(name);
    } catch {
      await this.qdrant.createCollection(name, {
        vectors: {
          size: 1536, // text-embedding-3-small dimension
          distance: 'Cosine'
        }
      });
    }
  }

  private hashText(text: string): string {
    // Simple hash for caching
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}

// Retrieval System (inspirowane search_methods Michała)
export class RetrievalSystem {
  private qdrant: QdrantClient;
  private embeddingSystem: EmbeddingSystem;
  private logger: Logger;

  constructor(qdrant: QdrantClient, embeddingSystem: EmbeddingSystem, logger: Logger) {
    this.qdrant = qdrant;
    this.embeddingSystem = embeddingSystem;
    this.logger = logger;
  }

  // Query processor - understand and expand queries
  processQuery(query: string): {
    originalQuery: string;
    expandedQuery: string;
    keywords: string[];
    intent: 'product' | 'shipping' | 'return' | 'complaint' | 'general';
  } {
    const keywords = this.extractKeywords(query);
    const intent = this.detectIntent(query);
    const expandedQuery = this.expandQuery(query, keywords);

    return {
      originalQuery: query,
      expandedQuery,
      keywords,
      intent
    };
  }

  // Semantic search with hybrid approach
  async searchKnowledge(
    tenantId: string,
    query: string,
    limit: number = 5,
    threshold: number = 0.75
  ): Promise<Array<{
    docId: string;
    chunkText: string;
    score: number;
    metadata: Record<string, any>;
  }>> {
    const collectionName = `tenant_${tenantId}`;
    
    try {
      // Generate query embedding
      const queryEmbedding = await this.embeddingSystem.generateEmbedding(query);
      
      // Vector search
      const searchResult = await this.qdrant.search(collectionName, {
        vector: queryEmbedding,
        limit: limit * 2, // Get more for reranking
        score_threshold: threshold,
        with_payload: true,
        with_vector: false
      });

      // Rerank results (simple implementation)
      const rerankedResults = this.rerankResults(query, searchResult);
      
      return rerankedResults.slice(0, limit).map(result => ({
        docId: result.payload?.doc_id as string,
        chunkText: result.payload?.chunk_text as string,
        score: result.score,
        metadata: result.payload?.metadata as Record<string, any> || {}
      }));

    } catch (error) {
      this.logger.error({ error, tenantId, query }, 'Knowledge search failed');
      return [];
    }
  }

  private extractKeywords(query: string): string[] {
    // Simple keyword extraction for Polish
    const stopWords = new Set(['i', 'w', 'na', 'z', 'do', 'o', 'czy', 'jak', 'co', 'gdzie', 'kiedy']);
    
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 5); // Top 5 keywords
  }

  private detectIntent(query: string): 'product' | 'shipping' | 'return' | 'complaint' | 'general' {
    const patterns = {
      product: /produkt|specyfikacja|dostępn|kolor|rozmiar|cena/i,
      shipping: /wysyłka|dostawa|koszt|czas|pobranie/i,
      return: /zwrot|reklamacja|wymiana|oddać/i,
      complaint: /problem|uszkodz|nie działa|błąd|reklamacja/i
    };

    for (const [intent, pattern] of Object.entries(patterns)) {
      if (pattern.test(query)) {
        return intent as any;
      }
    }

    return 'general';
  }

  private expandQuery(query: string, keywords: string[]): string {
    // Simple query expansion with synonyms
    const synonyms: Record<string, string[]> = {
      'dostawa': ['wysyłka', 'transport', 'przesyłka'],
      'zwrot': ['reklamacja', 'wymiana', 'oddanie'],
      'produkt': ['towar', 'artykuł', 'przedmiot'],
      'cena': ['koszt', 'opłata', 'kwota']
    };

    let expanded = query;
    keywords.forEach(keyword => {
      if (synonyms[keyword]) {
        expanded += ' ' + synonyms[keyword].join(' ');
      }
    });

    return expanded;
  }

  private rerankResults(query: string, results: any[]): any[] {
    // Simple reranking based on keyword matching
    const queryKeywords = this.extractKeywords(query);
    
    return results
      .map(result => {
        const text = result.payload?.chunk_text?.toLowerCase() || '';
        const keywordMatches = queryKeywords.filter(keyword => 
          text.includes(keyword.toLowerCase())
        ).length;
        
        // Boost score based on keyword matches
        const boostedScore = result.score + (keywordMatches * 0.1);
        
        return { ...result, score: boostedScore };
      })
      .sort((a, b) => b.score - a.score);
  }
}

// Generation System (inspirowane providers Michała)
export class GenerationSystem {
  private openai: OpenAI;
  private logger: Logger;
  private promptTemplates: Map<string, string> = new Map();

  constructor(openaiKey: string, logger: Logger) {
    this.openai = new OpenAI({ apiKey: openaiKey });
    this.logger = logger;
    this.initializePromptTemplates();
  }

  private initializePromptTemplates(): void {
    this.promptTemplates.set('default', `
WAŻNE INSTRUKCJE:
- Jesteś profesjonalnym asystentem sprzedażowym polskiego sklepu internetowego
- Odpowiadaj WYŁĄCZNIE na podstawie podanej WIEDZY FIRMY
- Jeśli nie masz dokładnej informacji, powiedz "Nie mam tej informacji. Przekieruj to pytanie do konsultanta"
- NIE WYMYŚLAJ żadnych szczegółów, cen, terminów, procedur
- Bądź pomocny, ale tylko w ramach dostępnej wiedzy
- Odpowiadaj po polsku, w przyjaznym tonie

WIEDZA FIRMY:
{knowledge}

PYTANIE KLIENTA: {query}

ODPOWIEDŹ (tylko na podstawie wiedzy powyżej):`);

    this.promptTemplates.set('product', `
Jesteś ekspertem produktowym. Odpowiadaj na podstawie specyfikacji produktu.

SPECYFIKACJA PRODUKTU:
{knowledge}

PYTANIE O PRODUKT: {query}

ODPOWIEDŹ EKSPERTA:`);

    this.promptTemplates.set('shipping', `
Jesteś specjalistą od dostaw. Udzielaj informacji o wysyłce i dostawie.

INFORMACJE O DOSTAWIE:
{knowledge}

PYTANIE O DOSTAWĘ: {query}

ODPOWIEDŹ SPECJALISTY:`);
  }

  async generateResponse(
    query: string,
    knowledge: Array<{ chunkText: string; score: number }>,
    intent: string = 'default',
    maxTokens: number = 300
  ): Promise<{
    response: string;
    confidence: number;
    sources: string[];
    reasoning: string;
  }> {
    // Build context from knowledge
    const knowledgeContext = knowledge
      .map(k => k.chunkText)
      .join('\n\n');

    // Select appropriate template
    const template = this.promptTemplates.get(intent) || this.promptTemplates.get('default')!;
    
    // Build prompt
    const prompt = template
      .replace('{knowledge}', knowledgeContext)
      .replace('{query}', query);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Cost-effective choice
        messages: [
          {
            role: 'system',
            content: 'Jesteś profesjonalnym asystentem sprzedażowym. Odpowiadaj krótko i precyzyjnie.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Low creativity
        max_tokens: maxTokens,
        stop: ['PYTANIE:', 'WIEDZA:', 'KONIEC']
      });

      const responseText = response.choices[0].message.content || '';
      const confidence = knowledge.length > 0 ? knowledge[0].score : 0;
      
      return {
        response: responseText.trim(),
        confidence,
        sources: knowledge.map(k => k.chunkText.substring(0, 100) + '...'),
        reasoning: `Generated from ${knowledge.length} knowledge sources with intent: ${intent}`
      };

    } catch (error) {
      this.logger.error({ error, query }, 'Response generation failed');
      throw error;
    }
  }

  // Response validator
  validateResponse(response: string, knowledge: Array<{ chunkText: string }>): boolean {
    // Check if response is grounded in knowledge
    const responseLower = response.toLowerCase();
    const knowledgeTerms = knowledge
      .flatMap(k => k.chunkText.toLowerCase().split(/\s+/))
      .filter(term => term.length > 3);

    const matchingTerms = knowledgeTerms.filter(term => 
      responseLower.includes(term)
    ).length;

    const groundingScore = matchingTerms / Math.max(knowledgeTerms.length, 1);
    
    return groundingScore >= 0.15; // 15% of terms must match
  }
}

// Main Production RAG System
export class ProductionRAG {
  private documentProcessor: DocumentProcessor;
  private embeddingSystem: EmbeddingSystem;
  private retrievalSystem: RetrievalSystem;
  private generationSystem: GenerationSystem;
  private logger: Logger;

  constructor(config: {
    openaiKey: string;
    qdrantUrl: string;
    logger: Logger;
  }) {
    this.logger = config.logger;
    this.documentProcessor = new DocumentProcessor(config.logger);
    this.embeddingSystem = new EmbeddingSystem(config.openaiKey, config.qdrantUrl, config.logger);
    this.retrievalSystem = new RetrievalSystem(
      new QdrantClient({ url: config.qdrantUrl }),
      this.embeddingSystem,
      config.logger
    );
    this.generationSystem = new GenerationSystem(config.openaiKey, config.logger);

    this.logger.info('Production RAG system initialized');
  }

  // Full RAG pipeline
  async processQuery(
    tenantId: string,
    query: string,
    options: {
      maxResults?: number;
      threshold?: number;
      maxTokens?: number;
    } = {}
  ): Promise<{
    response: string;
    confidence: number;
    sources: string[];
    reasoning: string;
    cost: number;
  }> {
    const startTime = Date.now();
    
    try {
      // 1. Process query
      const queryInfo = this.retrievalSystem.processQuery(query);
      
      // 2. Retrieve knowledge
      const knowledge = await this.retrievalSystem.searchKnowledge(
        tenantId,
        queryInfo.expandedQuery,
        options.maxResults || 5,
        options.threshold || 0.75
      );

      // 3. Generate response
      const result = await this.generationSystem.generateResponse(
        query,
        knowledge,
        queryInfo.intent,
        options.maxTokens || 300
      );

      // 4. Validate response
      const isValid = this.generationSystem.validateResponse(result.response, knowledge);
      
      if (!isValid) {
        return {
          response: "Nie mam wystarczających informacji, aby odpowiedzieć na to pytanie. Czy mogę przekierować Cię do konsultanta?",
          confidence: 0,
          sources: [],
          reasoning: "Response failed validation - not grounded in knowledge",
          cost: this.calculateCost(query, result.response)
        };
      }

      const processingTime = Date.now() - startTime;
      
      this.logger.info({
        tenantId,
        query: query.substring(0, 100),
        intent: queryInfo.intent,
        knowledgeSources: knowledge.length,
        confidence: result.confidence,
        processingTime,
        isValid
      }, 'RAG query processed successfully');

      return {
        ...result,
        cost: this.calculateCost(query, result.response)
      };

    } catch (error) {
      this.logger.error({ error, tenantId, query }, 'RAG processing failed');
      throw error;
    }
  }

  // Add knowledge to system
  async addKnowledge(
    tenantId: string,
    docId: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      // 1. Process document
      const cleanContent = this.documentProcessor.preprocessText(content);
      const chunks = this.documentProcessor.chunkDocument(cleanContent);
      const deduplicatedChunks = this.documentProcessor.deduplicateChunks(chunks);

      // 2. Store embeddings
      await this.embeddingSystem.storeEmbeddings(tenantId, docId, deduplicatedChunks, metadata);

      this.logger.info({
        tenantId,
        docId,
        originalChunks: chunks.length,
        finalChunks: deduplicatedChunks.length
      }, 'Knowledge added to system');

    } catch (error) {
      this.logger.error({ error, tenantId, docId }, 'Failed to add knowledge');
      throw error;
    }
  }

  private calculateCost(query: string, response: string): number {
    // Rough cost calculation for GPT-3.5-turbo
    const inputTokens = Math.ceil(query.length / 4);
    const outputTokens = Math.ceil(response.length / 4);
    const embeddingTokens = Math.ceil(query.length / 4);
    
    const exchangeRate = 4.5; // USD to PLN
    
    const gptCost = ((inputTokens + outputTokens) / 1000) * 0.002 * exchangeRate;
    const embeddingCost = (embeddingTokens / 1000) * 0.0001 * exchangeRate;
    
    return gptCost + embeddingCost;
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      // Test embedding generation
      await this.embeddingSystem.generateEmbedding('test');
      
      // Test OpenAI
      await this.generationSystem.generateResponse('test', [], 'default', 10);
      
      return {
        status: 'healthy',
        details: {
          documentProcessor: 'ok',
          embeddingSystem: 'ok',
          retrievalSystem: 'ok',
          generationSystem: 'ok'
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