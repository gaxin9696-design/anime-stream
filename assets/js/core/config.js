const runtimeConfig = globalThis.ANIME_STREAM_CONFIG ?? {};

const normalizeBase = (value, fallback = "") => {
  const raw = value ?? fallback;
  if (!raw) {
    return "";
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/\/+$/, "");
  }

  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  return normalized.replace(/\/+$/, "");
};

const stripKnownPrefix = (value, prefixes = []) => {
  let output = String(value ?? "").replace(/^\/+/, "");
  prefixes.forEach((prefix) => {
    const cleanPrefix = String(prefix ?? "").replace(/^\/+/, "").replace(/\/+$/, "");
    if (!cleanPrefix) {
      return;
    }

    if (output === cleanPrefix) {
      output = "";
      return;
    }

    if (output.startsWith(`${cleanPrefix}/`)) {
      output = output.slice(cleanPrefix.length + 1);
    }
  });

  return output;
};

const joinUrl = (base, path) => {
  if (!path) {
    return base || "/";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!base) {
    return path.startsWith("/") ? path : `/${path}`;
  }

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${base}/${cleanPath}`.replace(/([^:]\/)\/+/g, "$1");
};

export const CONFIG = {
  siteName: runtimeConfig.siteName || "Anime Stream",
  siteTagline: runtimeConfig.siteTagline || "Mini Netflix anime chạy bằng static files, HLS và Cloudflare.",
  siteDescription:
    runtimeConfig.siteDescription ||
    "Anime Stream là project demo streaming anime tĩnh với HLS.js, Cloudflare Pages và R2.",
  siteBaseUrl: normalizeBase(runtimeConfig.siteBaseUrl || globalThis.location?.origin || ""),
  dataBaseUrl: normalizeBase(runtimeConfig.dataBaseUrl, "/data"),
  mediaBaseUrl: normalizeBase(runtimeConfig.mediaBaseUrl, "/media"),
  cdnBaseUrl: normalizeBase(runtimeConfig.cdnBaseUrl, ""),
  posterFallback: runtimeConfig.posterFallback || "/assets/images/placeholders/poster-fallback.jpg",
  bannerFallback: runtimeConfig.bannerFallback || "/assets/images/banner-home.jpg",
  routes: {
    home: "/",
    detail: "/views/detail.html",
    watch: "/views/watch.html",
    search: "/views/search.html",
    notFound: "/views/404.html"
  },
  storageKeys: {
    theme: "anime-stream:theme",
    history: "anime-stream:history",
    progress: "anime-stream:progress",
    favorites: "anime-stream:favorites"
  },
  defaults: {
    preferredSubtitle: runtimeConfig.preferredSubtitle || "vi",
    pageSize: Number(runtimeConfig.pageSize || 24),
    autoplay: Boolean(runtimeConfig.autoplay ?? false)
  }
};

export const withQuery = (pathname, params = {}) => {
  const url = new URL(pathname, globalThis.location?.origin || "https://example.com");

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      url.searchParams.delete(key);
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return `${url.pathname}${url.search}${url.hash}`;
};

export const resolveDataUrl = (inputPath = "") => {
  if (/^https?:\/\//i.test(inputPath)) {
    return inputPath;
  }

  const cleanPath = stripKnownPrefix(inputPath, [CONFIG.dataBaseUrl, "data"]);
  return joinUrl(CONFIG.dataBaseUrl, cleanPath);
};

export const resolveMediaUrl = (inputPath = "") => {
  if (/^https?:\/\//i.test(inputPath)) {
    return inputPath;
  }

  const base = CONFIG.cdnBaseUrl || CONFIG.mediaBaseUrl;
  const cleanPath = stripKnownPrefix(inputPath, [CONFIG.mediaBaseUrl, "media"]);
  return joinUrl(base, cleanPath);
};

export const runtimeSummary = () => ({
  siteName: CONFIG.siteName,
  dataBaseUrl: CONFIG.dataBaseUrl,
  mediaBaseUrl: CONFIG.mediaBaseUrl,
  cdnBaseUrl: CONFIG.cdnBaseUrl,
  siteBaseUrl: CONFIG.siteBaseUrl
});

export const applyThemePreference = (themeName) => {
  const theme = themeName === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(CONFIG.storageKeys.theme, theme);
  return theme;
};

export const getSavedTheme = () => {
  const saved = localStorage.getItem(CONFIG.storageKeys.theme);
  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return "dark";
};
