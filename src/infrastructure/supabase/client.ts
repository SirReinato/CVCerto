import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../shared/types/database.types";

const rawUrl = import.meta.env.VITE_SUPABASE_URL || "";
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const isValidUrl = (url: string) => {
  try {
    return Boolean(new URL(url));
  } catch {
    return false;
  }
};

const supabaseUrl = isValidUrl(rawUrl) ? rawUrl : "https://placeholder.supabase.co";
const supabaseAnonKey = rawAnonKey || "placeholder-anon-key";

if (!rawUrl || !rawAnonKey) {
  console.warn(
    "[CV Certo] Atenção: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão configuradas ou são inválidas no .env. Inicializando com fallback para evitar quebra do React."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
