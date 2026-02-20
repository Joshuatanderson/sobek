import { docsGraphqlRequest } from '../../../src/client.ts';
import { assertAllowed } from '../../../src/permissions.ts';
import type {
  DocSearchResult,
  DocSearchResultType,
  DocSearchGraphQLResponse,
  GraphQLSearchResultNode,
} from '../../../src/types.ts';

export interface SearchDocsOptions {
  query: string;
  limit?: number;
}

/**
 * Maps GraphQL __typename to our simplified type.
 */
function mapResultType(typename?: string): DocSearchResultType {
  switch (typename) {
    case 'Guide':
      return 'guide';
    case 'CLICommandReference':
      return 'cli-reference';
    case 'ManagementApiReference':
      return 'api-reference';
    case 'ClientLibraryFunctionReference':
      return 'function-reference';
    case 'TroubleshootingGuide':
      return 'troubleshooting';
    default:
      return 'guide'; // Default fallback
  }
}

/**
 * Transforms a GraphQL node to our DocSearchResult format.
 */
function transformNode(node: GraphQLSearchResultNode): DocSearchResult {
  return {
    title: node.title,
    href: node.href,
    content: node.content,
    type: mapResultType(node.__typename),
    subsections: node.subsections?.nodes,
  };
}

/**
 * Builds the GraphQL query string for searching docs.
 */
function buildGraphQLQuery(searchQuery: string, limit?: number): string {
  const limitArg = limit ? `, limit: ${limit}` : '';

  return `
    query SearchDocs {
      searchDocs(query: "${escapeGraphQLString(searchQuery)}"${limitArg}) {
        nodes {
          __typename
          title
          href
          content
          ... on Guide {
            subsections {
              nodes {
                title
                href
                content
              }
            }
          }
          ... on ClientLibraryFunctionReference {
            language
            methodName
          }
        }
        totalCount
      }
    }
  `;
}

/**
 * Escapes special characters for GraphQL string literals.
 */
function escapeGraphQLString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Searches the Supabase documentation using a natural language query.
 *
 * @param options - Search options including query string and optional limit
 * @returns Array of matching documentation results
 *
 * @example
 * ```typescript
 * const results = await searchDocs({ query: 'authentication', limit: 5 });
 * results.forEach(r => console.log(`${r.title}: ${r.href}`));
 * ```
 */
export async function searchDocs(options: SearchDocsOptions): Promise<DocSearchResult[]> {
  // Check permissions
  await assertAllowed('docs', 'read');

  const { query, limit } = options;

  if (!query || query.trim().length === 0) {
    throw new Error('Search query cannot be empty');
  }

  // Build and execute the GraphQL query
  const graphqlQuery = buildGraphQLQuery(query.trim(), limit);
  const response = await docsGraphqlRequest<DocSearchGraphQLResponse>(graphqlQuery);

  // Transform the results
  const nodes = response.data?.searchDocs?.nodes ?? [];
  return nodes.map(transformNode);
}

/**
 * Gets the total count of search results without fetching all content.
 * Useful for pagination or showing result counts.
 */
export async function searchDocsCount(searchQuery: string): Promise<number> {
  await assertAllowed('docs', 'read');

  const query = `
    query SearchDocsCount {
      searchDocs(query: "${escapeGraphQLString(searchQuery)}") {
        totalCount
      }
    }
  `;

  const response = await docsGraphqlRequest<DocSearchGraphQLResponse>(query);
  return response.data?.searchDocs?.totalCount ?? 0;
}
