import { PermissionConfig, PermissionCategory, QueryRiskLevel } from './types.ts';
import { getCurrentEnvironment, getCurrentEnvironmentName } from './environments.ts';

// Default categories allowed for all environments
const DEFAULT_ALLOWED_CATEGORIES: PermissionCategory[] = [
  'database',
  'docs',
  'logs',
  'config',
  'advisors',
  'branches',
  'edge-functions',
];

/**
 * Gets permissions for the current environment.
 * Permissions are dynamically computed based on the environment.
 */
export function getPermissions(): PermissionConfig {
  const env = getCurrentEnvironment();

  return {
    allowedCategories: DEFAULT_ALLOWED_CATEGORIES,
    allowWrite: env.allowWrite,
    allowDestructive: env.allowDestructive,
  };
}

/**
 * Loads permissions - now just returns environment-based permissions.
 * Kept for backwards compatibility.
 */
export async function loadPermissions(): Promise<PermissionConfig> {
  return getPermissions();
}

/**
 * Checks if a category is allowed.
 */
export async function isCategoryAllowed(category: PermissionCategory): Promise<boolean> {
  const perms = await loadPermissions();
  return perms.allowedCategories.includes(category);
}

/**
 * Analyzes a SQL query to determine its risk level.
 */
export function analyzeQueryRisk(query: string): QueryRiskLevel {
  const normalized = query.toUpperCase().trim();

  // Destructive operations
  const destructivePatterns = [
    /DROP\s+(TABLE|DATABASE|SCHEMA|INDEX|VIEW|FUNCTION|POLICY)/i,
    /TRUNCATE/i,
    /DELETE\s+FROM\s+\w+\s*(;|$)/i, // DELETE without WHERE
    /ALTER\s+TABLE\s+\w+\s+DROP/i,
  ];

  for (const pattern of destructivePatterns) {
    if (pattern.test(normalized)) {
      return 'destructive';
    }
  }

  // Write operations
  const writePatterns = [
    /INSERT\s+INTO/i,
    /UPDATE\s+\w+\s+SET/i,
    /DELETE\s+FROM/i,
    /CREATE\s+(TABLE|INDEX|VIEW|FUNCTION|SCHEMA)/i,
    /ALTER\s+TABLE/i,
    /GRANT/i,
    /REVOKE/i,
  ];

  for (const pattern of writePatterns) {
    if (pattern.test(normalized)) {
      return 'write';
    }
  }

  // Default to read
  return 'read';
}

/**
 * Validates if an operation is allowed based on current environment permissions.
 */
export async function validateOperation(
  category: PermissionCategory,
  riskLevel: QueryRiskLevel = 'read'
): Promise<{ allowed: boolean; reason?: string }> {
  const perms = getPermissions();
  const env = getCurrentEnvironment();
  const envName = getCurrentEnvironmentName();

  if (!perms.allowedCategories.includes(category)) {
    return {
      allowed: false,
      reason: `Category '${category}' is not in the allowed list: ${perms.allowedCategories.join(', ')}`,
    };
  }

  if (riskLevel === 'write' && !perms.allowWrite) {
    return {
      allowed: false,
      reason: `Write operations are BLOCKED on ${env.name}. Environment '${envName}' is read-only.`,
    };
  }

  if (riskLevel === 'destructive') {
    if (!perms.allowDestructive) {
      return {
        allowed: false,
        reason: `Destructive operations are BLOCKED on ${env.name}. This is a safety feature.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Permission error class for typed error handling.
 */
export class PermissionError extends Error {
  constructor(message: string) {
    super(`Permission denied: ${message}`);
    this.name = 'PermissionError';
  }
}

/**
 * Asserts that an operation is allowed, throws PermissionError if not.
 */
export async function assertAllowed(
  category: PermissionCategory,
  riskLevel: QueryRiskLevel = 'read'
): Promise<void> {
  const result = await validateOperation(category, riskLevel);
  if (!result.allowed) {
    throw new PermissionError(result.reason ?? 'Operation not allowed');
  }
}
