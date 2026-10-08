import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[CV Certo] Atenção: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão configuradas no .env. Algumas funcionalidades podem não funcionar."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
