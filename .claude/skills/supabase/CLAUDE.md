# Supabase Skill - Claude Instructions

## BEFORE QUERYING: Use db-schema Skill

**CRITICAL**: Before writing ANY SQL query, invoke the `db-schema` skill to verify table and column names.

## WHEN TO USE THIS SKILL

**Use this skill for ALL Supabase database operations.** This includes:

- Querying tables or data (dev OR prod)
- Listing tables, migrations, extensions
- Running SQL queries
- Generating TypeScript types
- Searching Supabase documentation
- Checking project logs
- Getting security/performance advisors
- Managing edge functions (deploy, list, invoke)

## Environments

| Environment | Project ID | Writes | Usage |
|-------------|------------|--------|-------|
| `dev` (default) | `rjywhvxntptqwofymgqg` | Yes | Default, testing |
| `prod` | `rjywhvxntptqwofymgqg` | **No** | Read-only queries |

**Production is READ-ONLY** - all write operations are blocked at the code level.

## If This Skill Blocks an Operation

**CRITICAL**: If this skill blocks an operation, treat the block as user intent, not an obstacle.

- Do NOT use curl, fetch, or direct CLI to bypass the block
- **ASK THE USER** what they want to do instead
- The user can invoke manually from the Supabase dashboard if needed

**Why this matters:** Running operations twice (user + Claude) can cause duplicate emails, duplicate data, or other unintended side effects. These safety measures exist to prevent that.

## DO NOT USE (Use This Skill Instead)

| Instead of... | Use this skill's... |
|---------------|---------------------|
| `mcp__supabase__execute_sql` | `executeRawSql()` |
| `mcp__supabase__apply_migration` | `applyMigration()` |
| `mcp__supabase__list_tables` | `listTables()` |
| `mcp__supabase__*` (any) | Corresponding tool in `servers/supabase/` |
| Supabase CLI directly | This skill's TypeScript tools |

## Environment Variables

**CRITICAL**: This skill requires environment variables from the **project root** `.env` file, NOT from within this directory.

### Required Variables

The following environment variables must be set in the project root's `.env`:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Supabase publishable key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- `SUPABASE_ACCESS_TOKEN` - Supabase Management API token (for raw SQL execution)

### Running Scripts

Always run scripts from the **project root directory**, not from within the skill directory:

```bash
# CORRECT - Run from project root
bun .claude/skills/supabase/script.ts --env=dev
bun .claude/skills/supabase/script.ts --env=prod

# WRONG - Environment variables won't be found
cd .claude/skills/supabase && bun script.ts
```

## Quick Reference

### Setting Environment

```typescript
import { setEnvironment, getCurrentEnvironment, isProduction } from './src/index.ts';

// Set to production (read-only)
setEnvironment('prod');

// Check current environment
const env = getCurrentEnvironment();
console.log(env.name); // "Production (READ-ONLY)"
console.log(env.projectRef); // "rjywhvxntptqwofymgqg"
console.log(env.allowWrite); // false

// Quick checks
if (isProduction()) {
  console.log('Running against production');
}
```

### Common Operations

```typescript
// List all tables
import { listTables } from './servers/supabase/database/listTables.ts';
const tables = await listTables();

// Execute a query
import { executeRawSql, assertAllowed, analyzeQueryRisk, setEnvironment } from './src/index.ts';

setEnvironment('prod'); // Use production
const query = `SELECT * FROM users LIMIT 10`;
await assertAllowed('database', analyzeQueryRisk(query));
const result = await executeRawSql(query);

// Search documentation
import { searchDocs } from './servers/supabase/docs/searchDocs.ts';
const docs = await searchDocs('authentication');
```

### Write Protection Example

```typescript
import { executeRawSql, assertAllowed, analyzeQueryRisk, setEnvironment } from './src/index.ts';

setEnvironment('prod');

const insertQuery = `INSERT INTO logs (message) VALUES ('test')`;
await assertAllowed('database', analyzeQueryRisk(insertQuery));
// Throws: "Permission denied: Write operations are BLOCKED on Production (READ-ONLY). Environment 'prod' is read-only."
```

### Available Tool Categories

See `servers/supabase/` for implementations:
- `database/` - SQL execution, tables, migrations, types
- `docs/` - Documentation search
- `logs/` - Project logs
- `config/` - URLs, keys, extensions
- `advisors/` - Security/performance checks
- `edge-functions/` - Function deployment, listing, and invocation

## CLI Actions Reference

### Database Actions

```bash
# Query the database
bun .claude/skills/supabase/script.ts --env=dev --action=query --sql="SELECT * FROM users LIMIT 5"

# List all tables
bun .claude/skills/supabase/script.ts --env=dev --action=list-tables

# Apply a migration
bun .claude/skills/supabase/script.ts --env=dev --action=apply-migration --file=supabase/migrations/20250120_my_migration.sql
```

### Edge Function Actions

```bash
# List all edge functions
bun .claude/skills/supabase/script.ts --env=dev --action=list-functions

# Deploy an edge function
bun .claude/skills/supabase/script.ts --env=dev --action=deploy-function --name=my-function

# Deploy with JWT verification enabled
bun .claude/skills/supabase/script.ts --env=dev --action=deploy-function --name=my-function --verify-jwt

# Invoke an edge function
bun .claude/skills/supabase/script.ts --env=dev --action=invoke-function --name=parse-resume --body='{"applicationId":"abc-123"}'

# Invoke without a body
bun .claude/skills/supabase/script.ts --env=dev --action=invoke-function --name=my-function
```

### Invoke Function Output

The `invoke-function` action returns:
- **Status**: HTTP status code and text
- **Duration**: Request time in milliseconds
- **Response**: The function's JSON or text response

Example output:
```
[Invoke] Function: parse-resume
[Invoke] Body: {"applicationId":"abc-123"}

✅ Function invoked successfully!
   Status: 200 OK
   Duration: 1234ms

Response:
{
  "success": true,
  "message": "Resume parsed successfully"
}
```
