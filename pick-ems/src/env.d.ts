// Define the type of the environment variables.
declare interface Env {
    readonly NODE_ENV: string;
    // Replace the following with your own environment variables.
    // Example: NGX_VERSION: string;
    NG_APP_SUPABASE_PROJECT_ID: string;
    NG_APP_SUPABASE_ANON_KEY: string;
    NG_APP_VAPID_PUBLIC_KEY: string;
}

// Choose how to access the environment variables.
// Remove the unused options.

// 1. Use import.meta.env.YOUR_ENV_VAR in your code. (conventional)
declare interface ImportMeta {
    readonly env: Env;
}
