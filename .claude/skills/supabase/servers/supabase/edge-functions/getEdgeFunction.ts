import { managementApiRequest, getProjectRef } from '../../../src/client.ts';
import { assertAllowed } from '../../../src/permissions.ts';
import type { EdgeFunctionDetails, EdgeFunctionFile } from '../../../src/types.ts';

interface GetEdgeFunctionOptions {
  functionSlug: string;
}

interface RawEdgeFunctionDetails {
  id: string;
  slug: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  version: number;
  created_at: string | number;
  updated_at: string | number;
  entrypoint_path?: string;
  import_map_path?: string;
  import_map?: boolean;
  verify_jwt?: boolean;
  files: EdgeFunctionFile[];
}

/**
 * Gets details for a specific Edge Function.
 *
 * Note: The Management API returns function metadata but not file contents directly.
 * File contents are stored as ESZIP bundles which require special parsing.
 * The files array will typically be empty. Use the function's entrypoint_path
 * to locate source files locally if needed.
 */
export async function getEdgeFunction(options: GetEdgeFunctionOptions): Promise<EdgeFunctionDetails> {
  const { functionSlug } = options;

  if (!functionSlug) {
    throw new Error('functionSlug is required');
  }

  // Check permissions
  await assertAllowed('edge-functions', 'read');

  const projectRef = getProjectRef();
  const url = `/projects/${projectRef}/functions/${functionSlug}`;

  const response = await managementApiRequest<RawEdgeFunctionDetails>(url);

  // Convert timestamps - API returns numbers (unix ms) or strings
  const createdAt = typeof response.created_at === 'number'
    ? new Date(response.created_at).toISOString()
    : response.created_at;
  const updatedAt = typeof response.updated_at === 'number'
    ? new Date(response.updated_at).toISOString()
    : response.updated_at;

  return {
    id: response.id,
    slug: response.slug,
    name: response.name,
    status: response.status,
    version: response.version,
    createdAt,
    updatedAt,
    files: response.files || [],
  };
}
