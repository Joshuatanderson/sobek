export {
  createSupabaseClient,
  executeRawSql,
  managementApiRequest,
  getProjectRef,
  MANAGEMENT_API_BASE,
  // Environment functions
  setEnvironment,
  getCurrentEnvironment,
  getCurrentEnvironmentName,
  isProduction,
  isDevelopment,
} from './client.ts';

export type { Environment } from './client.ts';

export {
  loadPermissions,
  getPermissions,
  isCategoryAllowed,
  analyzeQueryRisk,
  validateOperation,
  assertAllowed,
  PermissionError,
} from './permissions.ts';

// Re-export environment types
export type { EnvironmentConfig } from './environments.ts';
export { ENVIRONMENTS } from './environments.ts';

export type {
  PermissionCategory,
  QueryRiskLevel,
  PermissionConfig,
  QueryResult,
  TableInfo,
  ColumnInfo,
  MigrationInfo,
  BranchInfo,
  EdgeFunctionInfo,
  LogEntry,
  AdvisoryNotice,
} from './types.ts';
