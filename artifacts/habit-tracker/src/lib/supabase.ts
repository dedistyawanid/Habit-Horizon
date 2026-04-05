import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const PLACEHOLDER_URL  = "https://dvhscmrnchajjxdjbfph.supabase.co";
const PLACEHOLDER_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2aHNjbXJuY2hhamp4ZGpiZnBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNTY4OTcsImV4cCI6MjA5MDkzMjg5N30.4H1JFtR68Qsn7jmTjKTvCIns6chypLYp-bOlude9Fv8";

export const supabase = createClient(
  supabaseUrl     || PLACEHOLDER_URL,
  supabaseAnonKey || PLACEHOLDER_KEY,
);

export const USER_ID = "dedi";
