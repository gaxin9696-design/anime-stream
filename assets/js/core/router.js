import { CONFIG, withQuery } from "./config.js";

export const getCurrentPage = () => {
  const path = globalThis.location?.pathname || "/";
  if (path === "/" || path.endsWith("/index.html") || path.endsWith("/home.html")) {
    return "home";
  }

  if (path.endsWith("/detail.html")) {
    return "detail";
  }

  if (path.endsWith("/watch.html")) {
    return "watch";
  }

  if (path.endsWith("/search.html")) {
    return "search";
  }

  if (path.endsWith("/404.html")) {
    return "404";
  }

  return "unknown";
};

export const getParams = () => new URL(globalThis.location.href).searchParams;

export const getParam = (key, fallback = null) => getParams().get(key) ?? fallback;

export const getNumberParam = (key, fallback = 1) => {
  const value = Number.parseInt(getParam(key, String(fallback)), 10);
  return Number.isFinite(value) ? value : fallback;
};

export const go = (pathname, params = {}) => {
  globalThis.location.href = withQuery(pathname, params);
};

export const replaceQuery = (params = {}) => {
  const nextUrl = withQuery(globalThis.location.pathname, {
    ...Object.fromEntries(getParams().entries()),
    ...params
  });
  globalThis.history.replaceState({}, "", nextUrl);
};

export const detailUrl = (id) => withQuery(CONFIG.routes.detail, { id });

export const watchUrl = (id, season = 1, ep = 1) =>
  withQuery(CONFIG.routes.watch, { id, season, ep });

export const searchUrl = (query = "", genre = "", sort = "") =>
  withQuery(CONFIG.routes.search, { q: query, genre, sort });
