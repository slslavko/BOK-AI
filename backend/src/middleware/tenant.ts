import { FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { MultiTenantDatabase } from '../config/database.js';

// Extend Fastify request interface to include tenant context
declare module 'fastify' {
  interface FastifyRequest {
    tenantId: string;
    userId: string;
    tenantDb: ReturnType<typeof MultiTenantDatabase.prototype.getTenantConnection>;
  }
}

// Tenant validation middleware
export async function tenantMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Extract tenant ID from header, subdomain, or URL param
    const tenantId = extractTenantId(request);
    
    if (!tenantId) {
      return reply.status(400).send({
        error: 'MISSING_TENANT',
        message: 'Tenant ID is required'
      });
    }

    // Validate tenant ID format (UUID)
    if (!isValidUUID(tenantId)) {
      return reply.status(400).send({
        error: 'INVALID_TENANT_FORMAT',
        message: 'Tenant ID must be a valid UUID'
      });
    }

    // Get user ID from JWT token (should be set by auth middleware)
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'User authentication required'
      });
    }

    // Get database instance
    const db = MultiTenantDatabase.getInstance(
      request.server.config.database,
      request.server.log
    );

    // Validate user has access to this tenant
    const hasAccess = await db.validateTenantAccess(tenantId, userId);
    if (!hasAccess) {
      request.server.log.warn(
        { tenantId, userId, ip: request.ip },
        'Unauthorized tenant access attempt'
      );
      
      return reply.status(403).send({
        error: 'FORBIDDEN',
        message: 'Access denied to this tenant'
      });
    }

    // Get tenant-specific database connection
    const tenantDb = await db.getTenantConnection(tenantId);

    // Add tenant context to request
    request.tenantId = tenantId;
    request.userId = userId;
    request.tenantDb = tenantDb;

    // Log successful tenant access
    request.server.log.debug(
      { tenantId, userId, route: request.routerPath },
      'Tenant access granted'
    );

  } catch (error) {
    request.server.log.error(
      { error, tenantId: request.headers['x-tenant-id'] },
      'Tenant middleware error'
    );
    
    return reply.status(500).send({
      error: 'INTERNAL_ERROR',
      message: 'Tenant validation failed'
    });
  }
}

/**
 * Extract tenant ID from various sources
 */
function extractTenantId(request: FastifyRequest): string | null {
  // 1. Check X-Tenant-ID header (primary method)
  const headerTenantId = request.headers['x-tenant-id'] as string;
  if (headerTenantId) {
    return headerTenantId;
  }

  // 2. Check subdomain (e.g., tenant123.bok-ai.com)
  const host = request.headers.host;
  if (host) {
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
      // This would require a mapping from subdomain to tenant ID
      // For now, we'll skip this implementation
    }
  }

  // 3. Check URL parameter
  const queryTenantId = request.query?.tenantId as string;
  if (queryTenantId) {
    return queryTenantId;
  }

  // 4. Check URL path parameter
  const pathTenantId = request.params?.tenantId as string;
  if (pathTenantId) {
    return pathTenantId;
  }

  return null;
}

/**
 * Validate UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Rate limiting per tenant
 */
export async function tenantRateLimit(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const tenantId = request.tenantId;
  if (!tenantId) {
    return; // Skip if no tenant context
  }

  const redis = request.server.redis;
  const rateLimitKey = `rate_limit:${tenantId}:${request.ip}`;
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 1000; // Per tenant per IP

  try {
    const current = await redis.incr(rateLimitKey);
    
    if (current === 1) {
      await redis.expire(rateLimitKey, Math.ceil(windowMs / 1000));
    }

    if (current > maxRequests) {
      request.server.log.warn(
        { tenantId, ip: request.ip, requests: current },
        'Rate limit exceeded for tenant'
      );
      
      return reply.status(429).send({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests for this tenant',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add rate limit headers
    reply.header('X-RateLimit-Limit', maxRequests);
    reply.header('X-RateLimit-Remaining', Math.max(0, maxRequests - current));
    reply.header('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString());

  } catch (error) {
    request.server.log.error(
      { error, tenantId },
      'Rate limiting error'
    );
    // Continue without rate limiting on Redis error
  }
}

/**
 * Tenant-specific logging context
 */
export async function tenantLogging(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (request.tenantId) {
    // Add tenant context to all logs for this request
    request.log = request.log.child({
      tenantId: request.tenantId,
      userId: request.userId
    });
  }
}

/**
 * Security headers for tenant isolation
 */
export async function tenantSecurityHeaders(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Prevent tenant data leakage through browser caching
  reply.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  reply.header('Pragma', 'no-cache');
  reply.header('Expires', '0');
  
  // Add tenant-specific CSP if needed
  if (request.tenantId) {
    reply.header('X-Tenant-ID', request.tenantId);
  }
  
  // Prevent clickjacking
  reply.header('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  reply.header('X-Content-Type-Options', 'nosniff');
}

/**
 * Plugin to register all tenant middleware
 */
export default fp(async function tenantPlugin(fastify) {
  // Register tenant middleware for all routes that need it
  fastify.addHook('preHandler', tenantMiddleware);
  fastify.addHook('preHandler', tenantRateLimit);
  fastify.addHook('preHandler', tenantLogging);
  fastify.addHook('preHandler', tenantSecurityHeaders);
  
  // Add tenant utilities to fastify instance
  fastify.decorate('getTenantDb', function(tenantId: string) {
    const db = MultiTenantDatabase.getInstance(
      this.config.database,
      this.log
    );
    return db.getTenantConnection(tenantId);
  });
  
  fastify.decorate('validateTenantAccess', function(tenantId: string, userId: string) {
    const db = MultiTenantDatabase.getInstance(
      this.config.database,
      this.log
    );
    return db.validateTenantAccess(tenantId, userId);
  });
  
}, {
  name: 'tenant-plugin',
  dependencies: ['@fastify/jwt', '@fastify/redis']
}); 