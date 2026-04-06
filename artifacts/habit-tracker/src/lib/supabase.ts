import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[supabase] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set as environment variables. " +
    "Cloud sync will not work until these are configured."
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");

let _currentUserId = "";
export function setCurrentUserId(id: string) { _currentUserId = id; }
export function getUserId(): string { return _currentUserId; }
