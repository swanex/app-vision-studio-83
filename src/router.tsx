import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const resolveBasePath = (): string => {
  if (typeof window !== "undefined") {
    if (
      window.location.hostname.endsWith(".github.io") &&
      window.location.pathname.startsWith("/app-vision-studio-83")
    ) {
      return "/app-vision-studio-83";
    }
    return "/";
  }

  const configuredBasePath = import.meta.env.BASE_URL.replace(/\/+$/, "");
  if (!configuredBasePath || configuredBasePath === ".") {
    return "/";
  }
  return configuredBasePath;
};

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    basepath: resolveBasePath(),
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
