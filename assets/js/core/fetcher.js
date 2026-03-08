import { resolveDataUrl } from "./config.js";

const responseCache = new Map();

export const fetchJson = async (url, options = {}) => {
  const cacheKey = options.cacheKey || url;

  if (!options.bust && responseCache.has(cacheKey)) {
    return structuredClone(responseCache.get(cacheKey));
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Không tải được dữ liệu: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  responseCache.set(cacheKey, payload);
  return structuredClone(payload);
};

export const fetchText = async (url, options = {}) => {
  const cacheKey = options.cacheKey || url;

  if (!options.bust && responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Không tải được nội dung: ${response.status} ${response.statusText}`);
  }

  const payload = await response.text();
  responseCache.set(cacheKey, payload);
  return payload;
};

export const fetchCatalog = async () => {
  const payload = await fetchJson(resolveDataUrl("catalog.json"));
  return Array.isArray(payload) ? payload : payload.items ?? [];
};

export const fetchHomepage = () => fetchJson(resolveDataUrl("homepage.json"));

export const fetchGenres = () => fetchJson(resolveDataUrl("genres.json"));

export const fetchAnime = (animeId) => fetchJson(resolveDataUrl(`anime/${animeId}.json`));

export const clearCache = () => responseCache.clear();
