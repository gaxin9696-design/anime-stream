import { CONFIG } from "../core/config.js";
import { clamp } from "../core/utils.js";

const readStorage = (key, fallback) => {
  try {
    const payload = localStorage.getItem(key);
    return payload ? JSON.parse(payload) : fallback;
  } catch (error) {
    console.warn(`Không đọc được localStorage key=${key}`, error);
    return fallback;
  }
};

const writeStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const progressEntryKey = (animeId, episodeId) => `${animeId}::${episodeId}`;

export const getWatchProgress = (animeId, episodeId) => {
  const progress = readStorage(CONFIG.storageKeys.progress, {});
  return progress[progressEntryKey(animeId, episodeId)] ?? null;
};

export const saveWatchProgress = (payload) => {
  if (!payload?.animeId || !payload?.episodeId) {
    return;
  }

  const progress = readStorage(CONFIG.storageKeys.progress, {});
  const safeDuration = Number(payload.duration ?? 0);
  const safeCurrentTime = Number(payload.currentTime ?? 0);
  const progressPercent =
    safeDuration > 0 ? Math.round(clamp((safeCurrentTime / safeDuration) * 100, 0, 100)) : 0;

  progress[progressEntryKey(payload.animeId, payload.episodeId)] = {
    ...payload,
    progressPercent,
    updatedAt: new Date().toISOString()
  };

  const sortedKeys = Object.entries(progress)
    .sort(([, left], [, right]) => String(right.updatedAt).localeCompare(String(left.updatedAt)))
    .slice(0, 120);

  writeStorage(CONFIG.storageKeys.progress, Object.fromEntries(sortedKeys));
  saveRecentlyWatched({
    ...payload,
    progressPercent
  });
};

export const saveRecentlyWatched = (payload) => {
  const history = readStorage(CONFIG.storageKeys.history, []);
  const item = {
    animeId: payload.animeId,
    episodeId: payload.episodeId,
    title: payload.title,
    episodeTitle: payload.episodeTitle,
    season: payload.season,
    episode: payload.episode,
    poster: payload.poster,
    path: payload.path,
    currentTime: Number(payload.currentTime ?? 0),
    duration: Number(payload.duration ?? 0),
    progressPercent: Number(payload.progressPercent ?? 0),
    updatedAt: new Date().toISOString()
  };

  const deduped = history.filter(
    (entry) => !(entry.animeId === item.animeId && entry.episodeId === item.episodeId)
  );

  deduped.unshift(item);
  writeStorage(CONFIG.storageKeys.history, deduped.slice(0, 40));
};

export const listRecentlyWatched = (limit = 10) => readStorage(CONFIG.storageKeys.history, []).slice(0, limit);

export const clearHistory = () => {
  localStorage.removeItem(CONFIG.storageKeys.history);
  localStorage.removeItem(CONFIG.storageKeys.progress);
};
