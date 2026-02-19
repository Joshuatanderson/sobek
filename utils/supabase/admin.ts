import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { env } from "@/config/env";

export const supabaseAdmin = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);
