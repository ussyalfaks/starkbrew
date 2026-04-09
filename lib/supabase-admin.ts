import { createClient } from '@supabase/supabase-js';

// Server-only client — only import this in API routes, never in components
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
