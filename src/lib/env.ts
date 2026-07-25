const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  publicSupabaseUrl &&
    publicSupabaseAnonKey &&
    !publicSupabaseUrl.includes("your-project") &&
    !publicSupabaseAnonKey.includes("your-anon-key") &&
    !publicSupabaseAnonKey.includes("your_key"),
);

export function getPublicSupabaseEnv() {
  if (!isSupabaseConfigured || !publicSupabaseUrl || !publicSupabaseAnonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return {
    url: publicSupabaseUrl,
    anonKey: publicSupabaseAnonKey,
  };
}
