import { CONFIG, resolveMediaUrl } from "../core/config.js";
import { createElement, render } from "../core/dom.js";
import { detailUrl, watchUrl } from "../core/router.js";
import { escapeHtml, formatEpisodeCount, formatScore } from "../core/utils.js";

const createBadgeMarkup = (anime) => {
  const badges = [
    anime.maturity ? `<span class="anime-badge">${escapeHtml(anime.maturity)}</span>` : "",
    anime.type ? `<span class="anime-badge is-soft">${escapeHtml(anime.type)}</span>` : "",
    anime.year ? `<span class="anime-badge is-soft">${escapeHtml(anime.year)}</span>` : ""
  ];

  return badges.filter(Boolean).join("");
};

export const createAnimeCard = (anime, options = {}) => {
  const card = createElement("article", {
    className: `anime-card ${options.compact ? "is-compact" : ""}`.trim()
  });

  const poster = resolveMediaUrl(anime.poster || CONFIG.posterFallback);
  const backdrop = resolveMediaUrl(anime.backdrop || anime.cover || anime.poster || CONFIG.bannerFallback);

  card.innerHTML = `
    <a class="anime-card__media" href="${detailUrl(anime.id)}" aria-label="Mở chi tiết ${escapeHtml(anime.title)}">
      <img
        class="anime-card__image"
        src="${poster}"
        alt="${escapeHtml(anime.title)} poster"
        loading="lazy"
      />
      <div class="anime-card__overlay">
        <span class="anime-card__score">★ ${formatScore(anime.rating)}</span>
        <div class="anime-card__actions">
          <a class="button button--tiny button--primary" href="${watchUrl(anime.id, 1, 1)}">Xem ngay</a>
          <a class="button button--tiny button--ghost" href="${detailUrl(anime.id)}">Chi tiết</a>
        </div>
      </div>
    </a>

    <div class="anime-card__content">
      <div class="anime-card__badges">
        ${createBadgeMarkup(anime)}
      </div>

      <h3 class="anime-card__title">
        <a href="${detailUrl(anime.id)}">${escapeHtml(anime.title)}</a>
      </h3>

      <p class="anime-card__subtitle">${escapeHtml(
        anime.titleOriginal || anime.tagline || anime.summary || "Anime demo streaming"
      )}</p>

      <div class="anime-card__meta">
        <span>${formatEpisodeCount(anime.episodes)}</span>
        <span>${escapeHtml((anime.genres ?? []).slice(0, 2).join(" · ") || "Đang cập nhật")}</span>
      </div>
    </div>
  `;

  const image = card.querySelector(".anime-card__image");
  image?.addEventListener(
    "error",
    () => {
      image.src = CONFIG.posterFallback;
    },
    { once: true }
  );

  card.style.setProperty("--anime-card-backdrop", `url("${backdrop}")`);
  return card;
};

export const createHistoryCard = (entry) => {
  const card = createElement("article", {
    className: "history-card"
  });

  const progress = Math.max(0, Math.min(100, Number(entry.progressPercent ?? 0)));
  card.innerHTML = `
    <a class="history-card__media" href="${watchUrl(entry.animeId, entry.season ?? 1, entry.episode ?? 1)}">
      <img
        src="${resolveMediaUrl(entry.poster || CONFIG.posterFallback)}"
        alt="${escapeHtml(entry.title)}"
        loading="lazy"
      />
      <span class="history-card__progress" style="width:${progress}%"></span>
    </a>
    <div class="history-card__content">
      <strong class="history-card__title">${escapeHtml(entry.title || "Anime chưa đặt tên")}</strong>
      <span class="history-card__episode">${escapeHtml(entry.episodeTitle || "Tập gần nhất")}</span>
      <small class="history-card__hint">${progress}% đã xem</small>
    </div>
  `;

  return card;
};

export const renderAnimeGrid = (root, collection = [], options = {}) => {
  if (!root) {
    return;
  }

  const items = collection.map((anime) => createAnimeCard(anime, options));
  render(root, items);
};
