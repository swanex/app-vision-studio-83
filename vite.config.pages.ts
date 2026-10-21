import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * GitHub Pages build only.
 * Keep vite.config.ts separate so the existing host configuration is untouched.
 */
export default defineConfig({
  // A static host cannot run the TanStack Start server bundle.
  nitro: false,

  // Publish this repository at https://swanex.github.io/app-vision-studio-83/
  vite: {
    base: "/app-vision-studio-83/",
  },

  // The app uses client-side React state and Supabase directly from the browser.
  // Generate the SPA shell as index.html, which GitHub Pages can serve at the repo URL.
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
