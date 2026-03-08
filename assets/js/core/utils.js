export const slugify = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const unique = (values = []) => Array.from(new Set(values));

export const pickByIds = (items = [], ids = []) => {
  const index = new Map(items.map((item) => [item.id, item]));
  return ids.map((id) => index.get(id)).filter(Boolean);
};

export const formatMinutes = (minutes) => {
  const value = Number(minutes ?? 0);
  if (!Number.isFinite(value) || value <= 0) {
    return "Đang cập nhật";
  }

  if (value < 60) {
    return `${value} phút`;
  }

  const hours = Math.floor(value / 60);
  const remain = value % 60;
  return remain ? `${hours} giờ ${remain} phút` : `${hours} giờ`;
};

export const formatEpisodeCount = (count = 0) => {
  const value = Number(count ?? 0);
  if (!Number.isFinite(value) || value <= 0) {
    return "Chưa có tập";
  }

  return `${value} tập`;
};

export const formatSeasonEpisode = (seasonNumber = 1, episodeNumber = 1) =>
  `S${String(seasonNumber).padStart(2, "0")}E${String(episodeNumber).padStart(2, "0")}`;

export const formatScore = (score) => {
  const value = Number(score ?? 0);
  return Number.isFinite(value) && value > 0 ? value.toFixed(1) : "N/A";
};

export const formatTime = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds ?? 0)));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainSeconds = safeSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, remainSeconds]
      .map((part) => String(part).padStart(2, "0"))
      .join(":");
  }

  return [minutes, remainSeconds].map((part) => String(part).padStart(2, "0")).join(":");
};

export const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const debounce = (callback, wait = 250) => {
  let timerId = null;

  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => callback(...args), wait);
  };
};

export const throttle = (callback, wait = 120) => {
  let inFlight = false;

  return (...args) => {
    if (inFlight) {
      return;
    }

    inFlight = true;
    callback(...args);
    setTimeout(() => {
      inFlight = false;
    }, wait);
  };
};

export const sortCatalog = (items = [], sortBy = "trending") => {
  const collection = [...items];

  switch (sortBy) {
    case "year-desc":
      return collection.sort((a, b) => Number(b.year ?? 0) - Number(a.year ?? 0));
    case "year-asc":
      return collection.sort((a, b) => Number(a.year ?? 0) - Number(b.year ?? 0));
    case "rating":
      return collection.sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0));
    case "title":
      return collection.sort((a, b) => String(a.title).localeCompare(String(b.title), "vi"));
    case "latest":
      return collection.sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
    case "trending":
    default:
      return collection.sort((a, b) => Number(b.popularity ?? 0) - Number(a.popularity ?? 0));
  }
};

export const textIncludes = (source = "", query = "") =>
  String(source).toLowerCase().includes(String(query).toLowerCase());

export const matchAnime = (anime, query = "", genre = "") => {
  const normalizedQuery = String(query).trim().toLowerCase();
  const normalizedGenre = String(genre).trim().toLowerCase();

  const queryMatched =
    !normalizedQuery ||
    [anime.title, anime.titleOriginal, anime.summary, ...(anime.genres ?? [])]
      .filter(Boolean)
      .some((value) => textIncludes(value, normalizedQuery));

  const genreMatched =
    !normalizedGenre ||
    (anime.genres ?? []).some((item) => String(item).toLowerCase() === normalizedGenre);

  return queryMatched && genreMatched;
};

export const maybeArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null) {
    return [];
  }

  return [value];
};

export const createId = (...parts) =>
  parts
    .filter(Boolean)
    .map((part) => slugify(part))
    .join("-");

export const wait = (duration = 0) => new Promise((resolve) => setTimeout(resolve, duration));
