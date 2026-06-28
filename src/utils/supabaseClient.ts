import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://mxyvllipguotayicsqqs.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eXZsbGlwZ3VvdGF5aWNzcXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMzY1NjUsImV4cCI6MjA4NzcxMjU2NX0.F3JYlnXuundkshxkXHkaVcGGoWcpI3YLzsInKZnPnSs";

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn("Supabase environment variables are missing! Using default fallback keys. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment for your own project.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
