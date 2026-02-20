#!/usr/bin/env bun
/**
 * Supabase Skill CLI
 *
 * Usage:
 *   bun .claude/skills/supabase/script.ts --env=dev --action=apply-migration --file=path/to/migration.sql
 *   bun .claude/skills/supabase/script.ts --env=dev --action=query --sql="SELECT * FROM users LIMIT 5"
 *   bun .claude/skills/supabase/script.ts --env=dev --action=list-tables
 *   bun .claude/skills/supabase/script.ts --env=prod --action=query --sql="SELECT count(*) FROM users"
 *   bun .claude/skills/supabase/script.ts --env=dev --action=deploy-function --name=my-function
 *   bun .claude/skills/supabase/script.ts --env=dev --action=list-functions
 *   bun .claude/skills/supabase/script.ts --env=dev --action=invoke-function --name=parse-resume --body='{"applicationId":"abc-123"}'
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  setEnvironment,
  getCurrentEnvironment,
  getCurrentEnvironmentName,
  type Environment,
} from './src/index.ts';
import { applyMigration } from './servers/supabase/database/applyMigration.ts';
import { executeRawSql } from './src/client.ts';
import { listTables } from './servers/supabase/database/listTables.ts';
import { assertAllowed, analyzeQueryRisk } from './src/permissions.ts';
import { deployEdgeFunction } from './servers/supabase/edge-functions/deployEdgeFunction.ts';
import { listEdgeFunctions } from './servers/supabase/edge-functions/listEdgeFunctions.ts';
import { invokeEdgeFunction } from './servers/supabase/edge-functions/invokeEdgeFunction.ts';
import type { EdgeFunctionFile } from './src/types.ts';

type Action = 'apply-migration' | 'query' | 'list-tables' | 'deploy-function' | 'list-functions' | 'invoke-function';

interface CLIArgs {
  env: Environment;
  action?: Action;
  file?: string;
  sql?: string;
  name?: string;
  body?: string;
  verifyJwt?: boolean;
}

/**
 * Parses command line arguments.
 */
function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const result: CLIArgs = { env: 'dev' };

  const validActions = ['apply-migration', 'query', 'list-tables', 'deploy-function', 'list-functions', 'invoke-function'];

  for (const arg of args) {
    if (arg.startsWith('--env=')) {
      const envValue = arg.split('=')[1];
      if (envValue === 'dev' || envValue === 'prod') {
        result.env = envValue;
      } else {
        console.error(`Error: Invalid environment '${envValue}'. Must be 'dev' or 'prod'.`);
        process.exit(1);
      }
    } else if (arg.startsWith('--action=')) {
      const actionValue = arg.split('=')[1] as Action;
      if (validActions.includes(actionValue)) {
        result.action = actionValue;
      } else {
        console.error(`Error: Invalid action '${actionValue}'. Must be one of: ${validActions.join(', ')}`);
        process.exit(1);
      }
    } else if (arg.startsWith('--file=')) {
      result.file = arg.split('=').slice(1).join('='); // Handle paths with = in them
    } else if (arg.startsWith('--sql=')) {
      result.sql = arg.split('=').slice(1).join('='); // Handle SQL with = in it
    } else if (arg.startsWith('--name=')) {
      result.name = arg.split('=').slice(1).join('='); // Function name
    } else if (arg.startsWith('--body=')) {
      result.body = arg.split('=').slice(1).join('='); // JSON body for invoke-function
    } else if (arg === '--verify-jwt') {
      result.verifyJwt = true;
    } else if (arg === '--no-verify-jwt') {
      result.verifyJwt = false;
    }
  }

  return result;
}

/**
 * Extracts migration name from filename.
 * e.g., "20250120_fix_work_experiences_rls.sql" -> "fix_work_experiences_rls"
 */
function extractMigrationName(filePath: string): string {
  const basename = path.basename(filePath, '.sql');
  // Remove timestamp prefix if present (YYYYMMDD_ pattern)
  const withoutTimestamp = basename.replace(/^\d{8}_/, '');
  return withoutTimestamp;
}

/**
 * Main CLI handler.
 */
async function main(): Promise<void> {
  const args = parseArgs();

  // Set environment
  setEnvironment(args.env);
  const config = getCurrentEnvironment();
  const envName = getCurrentEnvironmentName();

  console.log(`[Supabase] Environment: ${config.name}`);
  console.log(`[Supabase] Project: ${config.projectRef}`);
  console.log(`[Supabase] Write allowed: ${config.allowWrite}`);
  console.log(`[Supabase] Destructive allowed: ${config.allowDestructive}`);

  if (envName === 'prod') {
    console.log('\n⚠️  PRODUCTION MODE - READ-ONLY ⚠️');
    console.log('Write and destructive operations are BLOCKED.\n');
  }

  // If no action specified, just print env info and exit
  if (!args.action) {
    return;
  }

  console.log(`\n[Action] ${args.action}`);

  try {
    switch (args.action) {
      case 'apply-migration': {
        if (!args.file) {
          console.error('Error: --file is required for apply-migration action');
          process.exit(1);
        }

        // Read the migration file
        const filePath = path.resolve(args.file);
        if (!fs.existsSync(filePath)) {
          console.error(`Error: Migration file not found: ${filePath}`);
          process.exit(1);
        }

        const query = fs.readFileSync(filePath, 'utf-8');
        const migrationName = extractMigrationName(filePath);

        console.log(`[Migration] Name: ${migrationName}`);
        console.log(`[Migration] File: ${filePath}`);
        console.log(`[Migration] SQL Preview:\n${query.slice(0, 500)}${query.length > 500 ? '...' : ''}\n`);

        // Check risk level and permissions
        const riskLevel = analyzeQueryRisk(query);
        console.log(`[Migration] Risk level: ${riskLevel}`);
        await assertAllowed('database', riskLevel);

        const result = await applyMigration({ name: migrationName, query });
        console.log(`\n✅ Migration applied successfully!`);
        console.log(`   Version: ${result.version}`);
        console.log(`   Name: ${result.name}`);
        break;
      }

      case 'query': {
        if (!args.sql) {
          console.error('Error: --sql is required for query action');
          process.exit(1);
        }

        // Check risk level and permissions
        const riskLevel = analyzeQueryRisk(args.sql);
        console.log(`[Query] Risk level: ${riskLevel}`);
        await assertAllowed('database', riskLevel);

        console.log(`[Query] Executing: ${args.sql}\n`);
        const result = await executeRawSql(args.sql);
        console.log('Result:');
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'list-tables': {
        const tables = await listTables();
        console.log('\nTables:');
        console.log(JSON.stringify(tables, null, 2));
        break;
      }

      case 'deploy-function': {
        if (!args.name) {
          console.error('Error: --name is required for deploy-function action');
          console.error('Usage: --action=deploy-function --name=function-name');
          process.exit(1);
        }

        // Look for the function in supabase/functions directory
        const functionsDir = path.resolve(process.cwd(), 'supabase', 'functions', args.name);
        if (!fs.existsSync(functionsDir)) {
          console.error(`Error: Function directory not found: ${functionsDir}`);
          process.exit(1);
        }

        console.log(`[Deploy] Function: ${args.name}`);
        console.log(`[Deploy] Directory: ${functionsDir}`);
        console.log(`[Deploy] Verify JWT: ${args.verifyJwt ?? false}`);

        // Read all files in the function directory
        const files: EdgeFunctionFile[] = [];
        const readFilesRecursively = (dir: string, basePath: string = '') => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

            if (entry.isDirectory()) {
              // Skip node_modules and other common directories
              if (!['node_modules', '.git', 'dist'].includes(entry.name)) {
                readFilesRecursively(fullPath, relativePath);
              }
            } else if (entry.isFile()) {
              // Include TypeScript, JavaScript, and JSON files
              if (/\.(ts|js|json)$/.test(entry.name)) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                files.push({ name: relativePath, content });
                console.log(`[Deploy] Including file: ${relativePath} (${content.length} bytes)`);
              }
            }
          }
        };

        readFilesRecursively(functionsDir);

        if (files.length === 0) {
          console.error('Error: No .ts, .js, or .json files found in function directory');
          process.exit(1);
        }

        console.log(`\n[Deploy] Deploying ${files.length} file(s)...`);

        const result = await deployEdgeFunction({
          name: args.name,
          files,
          verifyJwt: args.verifyJwt ?? false,
        });

        console.log(`\n✅ Function deployed successfully!`);
        console.log(`   Name: ${result.name}`);
        console.log(`   Slug: ${result.slug}`);
        console.log(`   Version: ${result.version}`);
        console.log(`   Status: ${result.status}`);
        break;
      }

      case 'list-functions': {
        const functions = await listEdgeFunctions();
        console.log('\nEdge Functions:');
        console.log(JSON.stringify(functions, null, 2));
        break;
      }

      case 'invoke-function': {
        if (!args.name) {
          console.error('Error: --name is required for invoke-function action');
          console.error('Usage: --action=invoke-function --name=function-name --body=\'{"key":"value"}\'');
          process.exit(1);
        }

        // Parse the body if provided
        let body: Record<string, unknown> | undefined;
        if (args.body) {
          try {
            body = JSON.parse(args.body);
          } catch {
            console.error('Error: --body must be valid JSON');
            console.error(`Received: ${args.body}`);
            process.exit(1);
          }
        }

        console.log(`[Invoke] Function: ${args.name}`);
        if (body) {
          console.log(`[Invoke] Body: ${JSON.stringify(body, null, 2)}`);
        }
        console.log('');

        const result = await invokeEdgeFunction({
          name: args.name,
          body,
        });

        if (result.ok) {
          console.log(`✅ Function invoked successfully!`);
        } else {
          console.log(`⚠️  Function returned non-OK status`);
        }
        console.log(`   Status: ${result.status} ${result.statusText}`);
        console.log(`   Duration: ${result.duration}ms`);
        console.log('\nResponse:');
        if (typeof result.data === 'object') {
          console.log(JSON.stringify(result.data, null, 2));
        } else {
          console.log(result.data);
        }
        break;
      }

      default:
        console.error(`Unknown action: ${args.action}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
