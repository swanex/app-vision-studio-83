import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * GitHub Pages build only.
 * Keep vite.config.ts separate so the existing host configuration is untouched.
 */
export default defineConfig({
  // A static host cannot run the TanStack Start server bundle.
  nitro: false,

  // Publish the app at the root of the custom domain https://bp.swanex.com/
  vite: {
    base: "./",
  },

  // The app uses client-side React state and Supabase directly from the browser.
  // Generate the SPA shell as index.html for GitHub Pages static hosting.
  tanstackStart: {
    spa: {
      enabled: true,
      prerender: {
        outputPath: "/index.html",
        crawlLinks: false,
      },
    },
  },
});
