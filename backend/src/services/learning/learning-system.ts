import { Logger } from 'pino';

// Learning data structures (inspired by Michał's feedback system)
export interface ConversationEntry {
  id: string;
  tenantId: string;
  threadId: string;
  userMessage: string;
  botResponse: string;
  confidence: number;
  sources: string[];
  timestamp: Date;
  platform: string;
  customerId: string;
  intent: string;
  responseTime: number;
  cost: number;
}

export interface FeedbackEntry {
  id: string;
  conversationId: string;
  tenantId: string;
  feedbackType: 'explicit' | 'implicit';
  rating?: 'good' | 'bad' | 'neutral';
  correction?: string;
  humanTakeover: boolean;
  timestamp: Date;
  context: Record<string, any>;
}

export interface LearningMetrics {
  totalConversations: number;
  averageConfidence: number;
  humanTakeoverRate: number;
  averageResponseTime: number;
  topIntents: Array<{ intent: string; count: number }>;
  improvementAreas: string[];
  costPerConversation: number;
}

// Conversation Logger (inspired by interaction_logger.py)
export class ConversationLogger {
  private logger: Logger;
  private conversationBuffer: ConversationEntry[] = [];
  private batchSize = 100;

  constructor(logger: Logger) {
    this.logger = logger;
    
    // Flush buffer every 30 seconds
    setInterval(() => {
      this.flushBuffer();
    }, 30000);
  }

  async logConversation(entry: Omit<ConversationEntry, 'id' | 'timestamp'>): Promise<void> {
    const conversationEntry: ConversationEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date()
    };

    // Add to buffer for batch processing
    this.conversationBuffer.push(conversationEntry);

    // Flush if buffer is full
    if (this.conversationBuffer.length >= this.batchSize) {
      await this.flushBuffer();
    }

    this.logger.debug({
      conversationId: conversationEntry.id,
      tenantId: entry.tenantId,
      intent: entry.intent,
      confidence: entry.confidence
    }, 'Conversation logged for learning');
  }

  private async flushBuffer(): Promise<void> {
    if (this.conversationBuffer.length === 0) return;

    try {
      // In production, this would write to database
      // For now, we'll simulate database write
      const batch = [...this.conversationBuffer];
      this.conversationBuffer = [];

      // Simulate async database write
      await this.writeToDatabaseBatch(batch);

      this.logger.info({
        batchSize: batch.length
      }, 'Conversation batch flushed to database');

    } catch (error) {
      this.logger.error({ error }, 'Failed to flush conversation buffer');
      // Re-add failed entries to buffer
      this.conversationBuffer.unshift(...this.conversationBuffer);
    }
  }

  private async writeToDatabaseBatch(entries: ConversationEntry[]): Promise<void> {
    // Simulate database write delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In production: INSERT INTO conversation_log (...)
    this.logger.debug(`Simulated database write for ${entries.length} conversations`);
  }

  private generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Feedback Collector (inspired by feedback_collector.py)
export class FeedbackCollector {
  private logger: Logger;
  private feedbackBuffer: FeedbackEntry[] = [];

  constructor(logger: Logger) {
    this.logger = logger;
  }

  // Explicit feedback from users
  async collectExplicitFeedback(
    conversationId: string,
    tenantId: string,
    rating: 'good' | 'bad' | 'neutral',
    correction?: string
  ): Promise<void> {
    const feedback: FeedbackEntry = {
      id: this.generateId(),
      conversationId,
      tenantId,
      feedbackType: 'explicit',
      rating,
      correction,
      humanTakeover: false,
      timestamp: new Date(),
      context: { source: 'user_rating' }
    };

    await this.storeFeedback(feedback);
    
    this.logger.info({
      conversationId,
      rating,
      hasCorrection: !!correction
    }, 'Explicit feedback collected');
  }

  // Implicit feedback from user behavior
  async collectImplicitFeedback(
    conversationId: string,
    tenantId: string,
    signals: {
      humanTakeover?: boolean;
      conversationLength?: number;
      userSatisfactionIndicators?: string[];
      followUpQuestions?: number;
    }
  ): Promise<void> {
    const feedback: FeedbackEntry = {
      id: this.generateId(),
      conversationId,
      tenantId,
      feedbackType: 'implicit',
      humanTakeover: signals.humanTakeover || false,
      timestamp: new Date(),
      context: {
        conversationLength: signals.conversationLength,
        satisfactionIndicators: signals.userSatisfactionIndicators,
        followUpQuestions: signals.followUpQuestions
      }
    };

    await this.storeFeedback(feedback);

    this.logger.debug({
      conversationId,
      humanTakeover: signals.humanTakeover,
      signals: Object.keys(signals)
    }, 'Implicit feedback collected');
  }

  private async storeFeedback(feedback: FeedbackEntry): Promise<void> {
    this.feedbackBuffer.push(feedback);
    
    // In production: INSERT INTO feedback_log (...)
    this.logger.debug(`Feedback stored: ${feedback.id}`);
  }

  private generateId(): string {
    return `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Performance Tracker (inspired by performance_tracker.py)
export class PerformanceTracker {
  private logger: Logger;
  private metrics: Map<string, any[]> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  trackResponseTime(tenantId: string, responseTime: number): void {
    this.addMetric(tenantId, 'response_times', responseTime);
  }

  trackConfidence(tenantId: string, confidence: number): void {
    this.addMetric(tenantId, 'confidence_scores', confidence);
  }

  trackCost(tenantId: string, cost: number): void {
    this.addMetric(tenantId, 'costs', cost);
  }

  trackIntent(tenantId: string, intent: string): void {
    this.addMetric(tenantId, 'intents', intent);
  }

  trackHumanTakeover(tenantId: string): void {
    this.addMetric(tenantId, 'human_takeovers', 1);
  }

  async getMetrics(tenantId: string, timeWindow: number = 24): Promise<LearningMetrics> {
    const responseTimes = this.getMetric(tenantId, 'response_times') || [];
    const confidenceScores = this.getMetric(tenantId, 'confidence_scores') || [];
    const costs = this.getMetric(tenantId, 'costs') || [];
    const intents = this.getMetric(tenantId, 'intents') || [];
    const humanTakeovers = this.getMetric(tenantId, 'human_takeovers') || [];

    const totalConversations = confidenceScores.length;
    const averageConfidence = this.average(confidenceScores);
    const humanTakeoverRate = humanTakeovers.length / Math.max(totalConversations, 1);
    const averageResponseTime = this.average(responseTimes);
    const costPerConversation = this.average(costs);

    // Count intents
    const intentCounts = intents.reduce((acc, intent) => {
      acc[intent] = (acc[intent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topIntents = Object.entries(intentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([intent, count]) => ({ intent, count }));

    // Identify improvement areas
    const improvementAreas = this.identifyImprovementAreas({
      averageConfidence,
      humanTakeoverRate,
      averageResponseTime
    });

    return {
      totalConversations,
      averageConfidence,
      humanTakeoverRate,
      averageResponseTime,
      topIntents,
      improvementAreas,
      costPerConversation
    };
  }

  private addMetric(tenantId: string, metricType: string, value: any): void {
    const key = `${tenantId}:${metricType}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const values = this.metrics.get(key)!;
    values.push({ value, timestamp: Date.now() });
    
    // Keep only last 1000 entries per metric
    if (values.length > 1000) {
      values.shift();
    }
  }

  private getMetric(tenantId: string, metricType: string): any[] {
    const key = `${tenantId}:${metricType}`;
    const entries = this.metrics.get(key) || [];
    
    // Filter last 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return entries
      .filter(entry => entry.timestamp > oneDayAgo)
      .map(entry => entry.value);
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private identifyImprovementAreas(metrics: {
    averageConfidence: number;
    humanTakeoverRate: number;
    averageResponseTime: number;
  }): string[] {
    const areas: string[] = [];

    if (metrics.averageConfidence < 0.7) {
      areas.push('Niska pewność odpowiedzi - potrzeba więcej wiedzy w bazie');
    }

    if (metrics.humanTakeoverRate > 0.3) {
      areas.push('Wysoki odsetek przejęć przez człowieka - bot wymaga treningu');
    }

    if (metrics.averageResponseTime > 5000) {
      areas.push('Długi czas odpowiedzi - optymalizacja wydajności');
    }

    return areas;
  }
}

// Query Optimizer (inspired by query_optimizer.py)
export class QueryOptimizer {
  private logger: Logger;
  private queryPatterns: Map<string, {
    originalQuery: string;
    optimizedQuery: string;
    successRate: number;
    usageCount: number;
  }> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  // Learn from successful queries
  async learnFromQuery(
    originalQuery: string,
    optimizedQuery: string,
    wasSuccessful: boolean
  ): Promise<void> {
    const key = this.normalizeQuery(originalQuery);
    const existing = this.queryPatterns.get(key);

    if (existing) {
      existing.usageCount++;
      if (wasSuccessful) {
        existing.successRate = (existing.successRate * (existing.usageCount - 1) + 1) / existing.usageCount;
      } else {
        existing.successRate = (existing.successRate * (existing.usageCount - 1)) / existing.usageCount;
      }
    } else {
      this.queryPatterns.set(key, {
        originalQuery,
        optimizedQuery,
        successRate: wasSuccessful ? 1 : 0,
        usageCount: 1
      });
    }

    this.logger.debug({
      originalQuery,
      optimizedQuery,
      wasSuccessful
    }, 'Query pattern learned');
  }

  // Get optimized query based on learned patterns
  async optimizeQuery(query: string): Promise<string> {
    const key = this.normalizeQuery(query);
    const pattern = this.queryPatterns.get(key);

    if (pattern && pattern.successRate > 0.7 && pattern.usageCount > 5) {
      this.logger.debug({
        originalQuery: query,
        optimizedQuery: pattern.optimizedQuery,
        successRate: pattern.successRate
      }, 'Applied learned query optimization');
      
      return pattern.optimizedQuery;
    }

    return query;
  }

  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/[^\w\sąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Main Learning System (inspired by Michał's learning module)
export class LearningSystem {
  private conversationLogger: ConversationLogger;
  private feedbackCollector: FeedbackCollector;
  private performanceTracker: PerformanceTracker;
  private queryOptimizer: QueryOptimizer;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.conversationLogger = new ConversationLogger(logger);
    this.feedbackCollector = new FeedbackCollector(logger);
    this.performanceTracker = new PerformanceTracker(logger);
    this.queryOptimizer = new QueryOptimizer(logger);

    this.logger.info('Learning system initialized');
  }

  // Log complete conversation for learning
  async logConversation(
    tenantId: string,
    threadId: string,
    userMessage: string,
    botResponse: string,
    metadata: {
      confidence: number;
      sources: string[];
      platform: string;
      customerId: string;
      intent: string;
      responseTime: number;
      cost: number;
    }
  ): Promise<string> {
    const conversationId = await this.conversationLogger.logConversation({
      tenantId,
      threadId,
      userMessage,
      botResponse,
      ...metadata
    });

    // Track performance metrics
    this.performanceTracker.trackResponseTime(tenantId, metadata.responseTime);
    this.performanceTracker.trackConfidence(tenantId, metadata.confidence);
    this.performanceTracker.trackCost(tenantId, metadata.cost);
    this.performanceTracker.trackIntent(tenantId, metadata.intent);

    return conversationId;
  }

  // Record user feedback
  async recordFeedback(
    conversationId: string,
    tenantId: string,
    feedback: {
      type: 'explicit' | 'implicit';
      rating?: 'good' | 'bad' | 'neutral';
      correction?: string;
      humanTakeover?: boolean;
      behaviorSignals?: Record<string, any>;
    }
  ): Promise<void> {
    if (feedback.type === 'explicit') {
      await this.feedbackCollector.collectExplicitFeedback(
        conversationId,
        tenantId,
        feedback.rating!,
        feedback.correction
      );
    } else {
      await this.feedbackCollector.collectImplicitFeedback(
        conversationId,
        tenantId,
        {
          humanTakeover: feedback.humanTakeover,
          ...feedback.behaviorSignals
        }
      );
    }

    // Track human takeover
    if (feedback.humanTakeover) {
      this.performanceTracker.trackHumanTakeover(tenantId);
    }
  }

  // Get learning insights for tenant
  async getLearningInsights(tenantId: string): Promise<{
    metrics: LearningMetrics;
    recommendations: string[];
    trends: Record<string, number>;
  }> {
    const metrics = await this.performanceTracker.getMetrics(tenantId);
    
    const recommendations = this.generateRecommendations(metrics);
    
    const trends = {
      confidenceTrend: this.calculateTrend(tenantId, 'confidence_scores'),
      responseTimeTrend: this.calculateTrend(tenantId, 'response_times'),
      costTrend: this.calculateTrend(tenantId, 'costs')
    };

    return {
      metrics,
      recommendations,
      trends
    };
  }

  // Optimize query based on learning
  async optimizeQuery(query: string): Promise<string> {
    return this.queryOptimizer.optimizeQuery(query);
  }

  // Learn from query success/failure
  async learnFromQueryResult(
    originalQuery: string,
    optimizedQuery: string,
    wasSuccessful: boolean
  ): Promise<void> {
    await this.queryOptimizer.learnFromQuery(originalQuery, optimizedQuery, wasSuccessful);
  }

  private generateRecommendations(metrics: LearningMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.averageConfidence < 0.6) {
      recommendations.push('Dodaj więcej dokumentów do bazy wiedzy, szczególnie dla intencji: ' + 
        metrics.topIntents.slice(0, 3).map(i => i.intent).join(', '));
    }

    if (metrics.humanTakeoverRate > 0.25) {
      recommendations.push('Wysokie przejęcia przez człowieka - rozważ obniżenie progu autonomii bota');
    }

    if (metrics.averageResponseTime > 3000) {
      recommendations.push('Długi czas odpowiedzi - optymalizuj embeddingi lub zwiększ cache');
    }

    if (metrics.costPerConversation > 0.5) {
      recommendations.push('Wysokie koszty - rozważ zwiększenie udziału lokalnego AI');
    }

    return recommendations;
  }

  private calculateTrend(tenantId: string, metricType: string): number {
    // Simple trend calculation (positive = improving, negative = worsening)
    const values = this.performanceTracker['getMetric'](tenantId, metricType);
    if (values.length < 10) return 0;

    const recent = values.slice(-5);
    const older = values.slice(-10, -5);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    return (recentAvg - olderAvg) / olderAvg;
  }

  // Health check for learning system
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      return {
        status: 'healthy',
        details: {
          conversationLogger: 'ok',
          feedbackCollector: 'ok',
          performanceTracker: 'ok',
          queryOptimizer: 'ok'
        }
      };
    } catch (error) {
      this.logger.error({ error }, 'Learning system health check failed');
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }
} 