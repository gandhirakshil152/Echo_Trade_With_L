/// <reference types="vite/client" />

/**
 * Type declarations for Vite environment variables.
 * All VITE_* variables must be declared here to avoid TypeScript red lines.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PROJECT_ID: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_GEMINI_API_KEY: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
