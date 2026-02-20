import { managementApiRequest, getProjectRef } from '../../../src/client.ts';
import { assertAllowed } from '../../../src/permissions.ts';
import type { PublishableKey } from '../../../src/types.ts';

interface ApiKeyResponse {
  name: string;
  api_key: string;
  disabled?: boolean;
}

/**
 * Gets all publishable API keys for the project.
 * Returns anon/publishable keys only, filtering out service role keys.
 * Publishable keys are recommended for client-side applications.
 */
export async function getPublishableKeys(): Promise<PublishableKey[]> {
  // Check permissions
  await assertAllowed('config', 'read');

  const projectRef = getProjectRef();

  // Get API keys from Management API
  const keys = await managementApiRequest<ApiKeyResponse[]>(`/projects/${projectRef}/api-keys`);

  // Filter to only return publishable (anon) keys, not service role
  const publishableKeys = keys.filter(key =>
    key.name.toLowerCase().includes('anon') ||
    key.name.toLowerCase().includes('publishable')
  );

  return publishableKeys.map(key => ({
    name: key.name,
    apiKey: key.api_key,
    disabled: key.disabled,
  }));
}
