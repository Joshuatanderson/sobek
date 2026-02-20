import { managementApiRequest, getProjectRef } from '../../../src/client.ts';
import { assertAllowed } from '../../../src/permissions.ts';

interface TypeGenResponse {
  types: string;
}

/**
 * Generates TypeScript types for the project schema.
 * Returns the raw TypeScript type definitions as a string.
 *
 * These types can be used with the Supabase client to get
 * full type safety for database operations.
 */
export async function generateTypes(): Promise<string> {
  // Check permissions
  await assertAllowed('database', 'read');

  const projectRef = getProjectRef();

  // Get TypeScript types from Management API
  const response = await managementApiRequest<TypeGenResponse>(
    `/projects/${projectRef}/types/typescript`
  );

  return response.types;
}
