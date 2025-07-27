import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Logger } from 'pino';

// Database connection configuration
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
}

// Multi-tenant database manager
export class MultiTenantDatabase {
  private static instance: MultiTenantDatabase;
  private connections: Map<string, ReturnType<typeof drizzle>> = new Map();
  private baseConnection: postgres.Sql;
  private logger: Logger;

  private constructor(config: DatabaseConfig, logger: Logger) {
    this.logger = logger;
    
    // Create base connection
    this.baseConnection = postgres({
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password,
      ssl: config.ssl,
      max: config.maxConnections || 20,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // Important for RLS
    });

    this.logger.info('Database connection pool initialized');
  }

  public static getInstance(config: DatabaseConfig, logger: Logger): MultiTenantDatabase {
    if (!MultiTenantDatabase.instance) {
      MultiTenantDatabase.instance = new MultiTenantDatabase(config, logger);
    }
    return MultiTenantDatabase.instance;
  }

  /**
   * Get database connection for specific tenant
   * Sets the tenant context for Row Level Security
   */
  public async getTenantConnection(tenantId: string) {
    const connectionKey = `tenant_${tenantId}`;
    
    if (!this.connections.has(connectionKey)) {
      // Create tenant-specific connection
      const tenantConnection = postgres({
        host: this.baseConnection.options.host,
        port: this.baseConnection.options.port,
        database: this.baseConnection.options.database,
        username: this.baseConnection.options.username,
        password: this.baseConnection.options.password,
        ssl: this.baseConnection.options.ssl,
        max: 5, // Fewer connections per tenant
        prepare: false,
        transform: {
          // Set tenant context for every query
          undefined: null,
        },
        onnotice: () => {}, // Suppress notices
      });

      // Set tenant context for RLS
      await tenantConnection`SET app.current_tenant = ${tenantId}`;
      
      const db = drizzle(tenantConnection, {
        logger: {
          logQuery: (query, params) => {
            this.logger.debug({ query, params, tenantId }, 'Database query executed');
          },
        },
      });

      this.connections.set(connectionKey, db);
      this.logger.info({ tenantId }, 'Tenant database connection created');
    }

    return this.connections.get(connectionKey)!;
  }

  /**
   * Get admin connection (no tenant context)
   * Used for user management, tenant creation, etc.
   */
  public getAdminConnection() {
    return drizzle(this.baseConnection, {
      logger: {
        logQuery: (query, params) => {
          this.logger.debug({ query, params }, 'Admin database query executed');
        },
      },
    });
  }

  /**
   * Execute raw SQL with tenant context
   */
  public async executeWithTenant<T>(
    tenantId: string, 
    query: (db: ReturnType<typeof drizzle>) => Promise<T>
  ): Promise<T> {
    const db = await this.getTenantConnection(tenantId);
    return query(db);
  }

  /**
   * Validate tenant exists and user has access
   */
  public async validateTenantAccess(tenantId: string, userId: string): Promise<boolean> {
    try {
      const adminDb = this.getAdminConnection();
      const result = await adminDb.execute(
        postgres.unsafe(`
          SELECT 1 FROM tenants t
          JOIN users u ON t.user_id = u.id
          WHERE t.id = $1 AND u.id = $2 AND t.is_active = true AND u.is_active = true
        `),
        [tenantId, userId]
      );
      
      return result.length > 0;
    } catch (error) {
      this.logger.error({ error, tenantId, userId }, 'Tenant access validation failed');
      return false;
    }
  }

  /**
   * Create new tenant with encrypted key
   */
  public async createTenant(userId: string, tenantData: {
    name: string;
    slug: string;
    domain?: string;
  }): Promise<string> {
    const adminDb = this.getAdminConnection();
    
    // Generate encryption key for tenant
    const encryptionKey = this.generateEncryptionKey();
    const encryptedKey = await this.encryptTenantKey(encryptionKey);
    
    const result = await adminDb.execute(
      postgres.unsafe(`
        INSERT INTO tenants (user_id, name, slug, domain, encryption_key_encrypted)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `),
      [userId, tenantData.name, tenantData.slug, tenantData.domain, encryptedKey]
    );

    const tenantId = result[0].id as string;
    
    // Initialize tenant with default bot config
    await this.initializeTenant(tenantId);
    
    this.logger.info({ tenantId, userId }, 'New tenant created');
    return tenantId;
  }

  /**
   * Initialize new tenant with default configuration
   */
  private async initializeTenant(tenantId: string): Promise<void> {
    const db = await this.getTenantConnection(tenantId);
    
    // Create default bot configuration
    await db.execute(
      postgres.unsafe(`
        INSERT INTO bot_configs (tenant_id, bot_name, bot_personality, autonomy_level)
        VALUES ($1, 'BOK', 'Przyjazny asystent sprzedażowy', 1)
      `),
      [tenantId]
    );

    // Create default knowledge document
    await db.execute(
      postgres.unsafe(`
        INSERT INTO knowledge_docs (tenant_id, title, content, category, tags)
        VALUES ($1, 'Witaj w BOK-AI', 'To jest Twoja pierwsza baza wiedzy. Dodaj dokumenty, FAQ i informacje o produktach.', 'Przewodnik', ARRAY['start', 'pomoc'])
      `),
      [tenantId]
    );

    this.logger.info({ tenantId }, 'Tenant initialized with default configuration');
  }

  /**
   * Generate secure encryption key for tenant
   */
  private generateEncryptionKey(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt tenant-specific key
   */
  private async encryptTenantKey(key: string): Promise<string> {
    const crypto = require('crypto');
    const masterKey = process.env.ENCRYPTION_KEY || 'default_master_key_change_me';
    
    const cipher = crypto.createCipher('aes-256-cbc', masterKey);
    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  }

  /**
   * Decrypt tenant-specific key
   */
  public async decryptTenantKey(encryptedKey: string): Promise<string> {
    const crypto = require('crypto');
    const masterKey = process.env.ENCRYPTION_KEY || 'default_master_key_change_me';
    
    const decipher = crypto.createDecipher('aes-256-cbc', masterKey);
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Health check for database connections
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    connections: number;
    details: any;
  }> {
    try {
      const adminDb = this.getAdminConnection();
      await adminDb.execute(postgres.unsafe('SELECT 1'));
      
      return {
        status: 'healthy',
        connections: this.connections.size,
        details: {
          baseConnection: 'connected',
          tenantConnections: this.connections.size,
        },
      };
    } catch (error) {
      this.logger.error({ error }, 'Database health check failed');
      return {
        status: 'unhealthy',
        connections: this.connections.size,
        details: { error: error.message },
      };
    }
  }

  /**
   * Close all connections
   */
  public async close(): Promise<void> {
    try {
      // Close tenant connections
      for (const [key, connection] of this.connections) {
        // Note: Drizzle doesn't expose close method directly
        // This would need to be handled at the postgres connection level
        this.logger.info({ connectionKey: key }, 'Closing tenant connection');
      }
      
      // Close base connection
      await this.baseConnection.end();
      
      this.connections.clear();
      this.logger.info('All database connections closed');
    } catch (error) {
      this.logger.error({ error }, 'Error closing database connections');
      throw error;
    }
  }
}

// Database configuration from environment
export const getDatabaseConfig = (): DatabaseConfig => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1),
      username: url.username,
      password: url.password,
      ssl: url.searchParams.get('ssl') === 'true',
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
    };
  }

  // Fallback to individual environment variables
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'bok_ai',
    username: process.env.DB_USER || 'bok_admin',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  };
}; 