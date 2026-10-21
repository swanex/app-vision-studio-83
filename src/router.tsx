import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Vite sets BASE_URL to "/app-vision-studio-83/" for GitHub Pages
// and to "/" for the usual root-hosted preview/deployment.
const configuredBasePath = import.meta.env.BASE_URL.replace(/\/+$/, "");
const basepath = configuredBasePath || "/";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    basepath,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
