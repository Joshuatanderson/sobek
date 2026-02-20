import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  getCurrentEnvironment,
  getCurrentEnvironmentName,
  setEnvironment,
  isProduction,
  isDevelopment,
  type Environment,
} from './environments.ts';

const MANAGEMENT_API_BASE = 'https://api.supabase.com/v1';

// Re-export environment functions for convenience
export { setEnvironment, getCurrentEnvironment, getCurrentEnvironmentName, isProduction, isDevelopment };
export type { Environment };

interface ClientConfig {
  useServiceRole?: boolean;
}

interface EnvVars {
  supabaseUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  accountToken: string;
}

function getEnvVars(): EnvVars {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const accountToken = process.env.SUPABASE_ACCESS_TOKEN;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  if (!anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is not set');
  }
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  if (!accountToken) {
    throw new Error('SUPABASE_ACCESS_TOKEN is not set');
  }

  return { supabaseUrl, anonKey, serviceRoleKey, accountToken };
}

/**
 * Creates a Supabase client for the current environment.
 * Use serviceRole for admin operations, anon for user-context operations.
 */
export function createSupabaseClient(config: ClientConfig = {}): SupabaseClient {
  const env = getEnvVars();
  const key = config.useServiceRole ? env.serviceRoleKey : env.anonKey;

  return createClient(env.supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Gets the project reference for the current environment.
 */
export function getProjectRef(): string {
  return getCurrentEnvironment().projectRef;
}

/**
 * Makes a request to the Supabase Management API.
 */
export async function managementApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const env = getEnvVars();
  const url = `${MANAGEMENT_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.accountToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Management API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Makes a multipart/form-data request to the Supabase Management API.
 * Used for edge function deployment which requires file uploads.
 */
export async function managementApiMultipartRequest<T>(
  endpoint: string,
  formData: FormData,
  method: 'POST' | 'PATCH' = 'POST'
): Promise<T> {
  const env = getEnvVars();
  const url = `${MANAGEMENT_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${env.accountToken}`,
      // Note: Don't set Content-Type for FormData - fetch sets it automatically with boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Management API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

interface ExecuteRawSqlOptions {
  /**
   * Force read-only mode at the database level.
   * When true, wraps the query in a READ ONLY transaction.
   * Automatically enabled for production environment.
   */
  forceReadOnly?: boolean;
}

/**
 * Executes raw SQL using the Management API.
 * This is more powerful than PostgREST for complex queries.
 *
 * For production environment or when forceReadOnly is true,
 * read queries are wrapped in a READ ONLY transaction for
 * database-level enforcement of read-only access.
 */
export async function executeRawSql<T>(
  query: string,
  options?: ExecuteRawSqlOptions
): Promise<T[]> {
  const projectRef = getProjectRef();

  // Determine if we should wrap in READ ONLY transaction
  // Auto-enable for production OR when explicitly requested
  const shouldWrapReadOnly = isProduction() || options?.forceReadOnly;

  let finalQuery = query;

  if (shouldWrapReadOnly) {
    // Wrap queries in a READ ONLY transaction for database-level enforcement
    // Uses correct PostgreSQL syntax: START TRANSACTION READ ONLY
    // This ensures PostgreSQL itself rejects any write attempts, even if
    // our pattern-based analyzeQueryRisk() misses something sneaky
    finalQuery = `START TRANSACTION READ ONLY; ${query}; COMMIT;`;
  }

  return managementApiRequest<T[]>(`/projects/${projectRef}/database/query`, {
    method: 'POST',
    body: JSON.stringify({ query: finalQuery }),
  });
}

/**
 * Makes a GraphQL request to the Supabase docs API.
 * This is separate from the Management API as it uses a different endpoint.
 */
export async function docsGraphqlRequest<T>(query: string): Promise<T> {
  // The Supabase docs GraphQL endpoint
  // This endpoint is publicly accessible for documentation search
  const DOCS_GRAPHQL_ENDPOINT = 'https://supabase.com/docs/api/graphql';

  const response = await fetch(DOCS_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Docs GraphQL API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();

  // Check for GraphQL errors
  if (result.errors && result.errors.length > 0) {
    const errorMessages = result.errors.map((e: { message: string }) => e.message).join(', ');
    throw new Error(`GraphQL errors: ${errorMessages}`);
  }

  return result;
}

// Export constants for use in tools
export { MANAGEMENT_API_BASE };
