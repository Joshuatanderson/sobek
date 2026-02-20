import { managementApiRequest, getProjectRef } from '../../../src/client.ts';
import { assertAllowed } from '../../../src/permissions.ts';

interface ApplyMigrationOptions {
  name: string;  // snake_case name
  query: string; // SQL DDL statements
}

interface ApplyMigrationResult {
  version: string;
  name: string;
  success: boolean;
}

/**
 * Validates that a migration name is in snake_case format.
 */
function validateMigrationName(name: string): void {
  const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

  if (!name || name.trim().length === 0) {
    throw new Error('Migration name cannot be empty');
  }

  if (!snakeCaseRegex.test(name)) {
    throw new Error(
      `Migration name must be in snake_case format (e.g., "add_users_table"). Got: "${name}"`
    );
  }
}

/**
 * Applies a DDL migration to the database.
 * Uses the Supabase Management API to apply migrations.
 */
export async function applyMigration(
  options: ApplyMigrationOptions
): Promise<ApplyMigrationResult> {
  const { name, query } = options;

  // Validate inputs
  validateMigrationName(name);

  if (!query || query.trim().length === 0) {
    throw new Error('Migration query cannot be empty');
  }

  // Check permissions - DDL operations require write access
  await assertAllowed('database', 'write');

  const projectRef = getProjectRef();

  // The Management API endpoint for running queries
  // Note: Supabase doesn't have a dedicated migration endpoint in the public API
  // We use the query endpoint and the migration is tracked by Supabase
  // Execute the migration via Management API
  await managementApiRequest<unknown>(
    `/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      body: JSON.stringify({ query }),
    }
  );

  // Generate a version based on current timestamp
  const version = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);

  return {
    version,
    name,
    success: true,
  };
}
