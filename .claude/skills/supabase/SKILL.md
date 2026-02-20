# Supabase Skill

**Environments:**
- **Dev:** `rjywhvxntptqwofymgqg` (writes allowed)
- **Prod:** `rjywhvxntptqwofymgqg` (READ-ONLY)

## Execute

```bash
# Run from project root (required for env vars)

# Development (default) - writes allowed
bun .claude/skills/supabase/script.ts
bun .claude/skills/supabase/script.ts --env=dev

# Production - READ-ONLY enforced
bun .claude/skills/supabase/script.ts --env=prod

# Deploy edge function (dev only)
bun .claude/skills/supabase/script.ts --env=dev --action=deploy-function --name=my-function
bun .claude/skills/supabase/script.ts --env=dev --action=deploy-function --name=my-function --verify-jwt

# List edge functions
bun .claude/skills/supabase/script.ts --env=dev --action=list-functions
```

## Environment Behavior

| Environment | Reads | Writes | Destructive |
|-------------|-------|--------|-------------|
| `dev` | Yes | Yes | No (blocked) |
| `prod` | Yes | **No** | No (blocked) |

Production environment **blocks all write operations** including:
- INSERT, UPDATE, DELETE
- CREATE TABLE, ALTER TABLE
- Any data modification

## Imports

```typescript
import {
  createSupabaseClient,
  executeRawSql,
  assertAllowed,
  analyzeQueryRisk,
  setEnvironment,
  getCurrentEnvironment,
  isProduction,
} from './src/index.ts';
```

## Example: Read from Production

```typescript
import {
  executeRawSql,
  assertAllowed,
  analyzeQueryRisk,
  setEnvironment,
  getCurrentEnvironment,
} from './src/index.ts';

// Set production environment
setEnvironment('prod');

const env = getCurrentEnvironment();
console.log(`Using: ${env.name} (${env.projectRef})`);

// Read query - allowed
const query = `SELECT * FROM users LIMIT 10`;
await assertAllowed('database', analyzeQueryRisk(query));
const result = await executeRawSql(query);
console.log(JSON.stringify(result, null, 2));
```

## Example: Write to Dev (Blocked on Prod)

```typescript
import {
  executeRawSql,
  assertAllowed,
  analyzeQueryRisk,
  setEnvironment,
} from './src/index.ts';

// This will work on dev
setEnvironment('dev');
const insertQuery = `INSERT INTO logs (message) VALUES ('test')`;
await assertAllowed('database', analyzeQueryRisk(insertQuery)); // passes
await executeRawSql(insertQuery);

// This will FAIL on prod
setEnvironment('prod');
await assertAllowed('database', analyzeQueryRisk(insertQuery));
// Throws: "Write operations are BLOCKED on Production (READ-ONLY)"
```

## Permissions

| Level | Operations | Dev | Prod |
|-------|------------|-----|------|
| `read` | SELECT, list operations | Yes | Yes |
| `write` | INSERT, UPDATE, CREATE | Yes | **No** |
| `destructive` | DROP, TRUNCATE, DELETE without WHERE | No | No |

```typescript
await assertAllowed('database', 'read');
await assertAllowed('database', analyzeQueryRisk(sqlQuery));
```

## Available Tools

See `servers/supabase/` for tool implementations by category:
- `database/` - SQL, tables, migrations, types
- `docs/` - documentation search
- `logs/` - project logs
- `config/` - URLs, keys, extensions
- `advisors/` - security/performance checks
- `branches/` - branch management
- `edge-functions/` - function deployment
