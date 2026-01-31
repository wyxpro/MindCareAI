
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const customFetch: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init);
  } catch (e) {
    return new Response(JSON.stringify({ error: "network_error" }), {
      status: 520,
      statusText: "Network Error",
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: customFetch },
});
            
