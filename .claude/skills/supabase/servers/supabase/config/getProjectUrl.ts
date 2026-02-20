import { getProjectRef } from '../../../src/client.ts';
import { assertAllowed } from '../../../src/permissions.ts';
import type { ProjectUrlInfo } from '../../../src/types.ts';

/**
 * Gets the API URL for the current project.
 * Returns the Supabase API URL that can be used to access the project.
 */
export async function getProjectUrl(): Promise<ProjectUrlInfo> {
  // Check permissions
  await assertAllowed('config', 'read');

  const projectRef = getProjectRef();

  // Construct the Supabase URL from the project ref
  const url = `https://${projectRef}.supabase.co`;

  return { url };
}
