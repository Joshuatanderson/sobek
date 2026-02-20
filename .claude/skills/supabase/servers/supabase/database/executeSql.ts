import { executeRawSql } from '../../../src/client.ts';
import { assertAllowed, analyzeQueryRisk } from '../../../src/permissions.ts';

interface ExecuteSqlOptions {
  query: string;
}

interface ExecuteSqlResult<T> {
  rows: T[];
  riskLevel: 'read' | 'write' | 'destructive';
}

/**
 * Executes arbitrary SQL queries with automatic permission checking.
 * The query is analyzed to determine its risk level (read/write/destructive)
 * and permissions are checked accordingly.
 */
export async function executeSql<T = Record<string, unknown>>(
  options: ExecuteSqlOptions
): Promise<ExecuteSqlResult<T>> {
  const { query } = options;

  if (!query || query.trim().length === 0) {
    throw new Error('Query cannot be empty');
  }

  // Analyze the query to determine risk level
  const riskLevel = analyzeQueryRisk(query);

  // Check permissions based on risk level
  await assertAllowed('database', riskLevel);

  // Execute the query
  const rows = await executeRawSql<T>(query);

  return {
    rows,
    riskLevel,
  };
}
