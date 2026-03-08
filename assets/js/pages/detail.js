import "../core/app.js";

import { CONFIG, resolveMediaUrl } from "../core/config.js";
import { fetchAnime, fetchCatalog } from "../core/fetcher.js";
import { clearElement, qs, setStatus } from "../core/dom.js";
import { getParam, watchUrl } from "../core/router.js";
import { createAnimeCard } from "../components/card.js";
import { getWatchProgress } from "../player/history.js";
import { getAdjacentEpisodes, renderEpisodeList } from "../components/episode-list.js";

const renderMetaList = (root, anime) => {
  root.innerHTML = `
    <li><span>Năm</span><strong>${anime.year || "N/A"}</strong></li>
    <li><span>Studio</span><strong>${anime.studio || "Đang cập nhật"}</strong></li>
    <li><span>Trạng thái</span><strong>${anime.status || "Đang cập nhật"}</strong></li>
    <li><span>Thời lượng</span><strong>${anime.duration || "Đang cập nhật"}</strong></li>
    <li><span>Thể loại</span><strong>${(anime.genres ?? []).join(", ") || "N/A"}</strong></li>
    <li><span>Điểm số</span><strong>${Number(anime.rating ?? 0).toFixed(1)}</strong></li>
  `;
};

const initDetail = async () => {
  const animeId = getParam("id");
  const statusRoot = qs("#detail-status");
  const heroRoot = qs("#detail-hero");
  const metaRoot = qs("#detail-meta");
  const episodesRoot = qs("#detail-episodes");
  const relatedRoot = qs("#detail-related");

  if (!animeId) {
    globalThis.location.href = CONFIG.routes.notFound;
    return;
  }

  try {
    setStatus(statusRoot, "loading", "Đang tải chi tiết anime...");
    const [anime, catalog] = await Promise.all([fetchAnime(animeId), fetchCatalog()]);

    heroRoot.style.setProperty(
      "--detail-image",
      `url("${resolveMediaUrl(anime.backdrop || anime.cover || anime.poster || CONFIG.bannerFallback)}")`
    );

    const firstEpisode = anime.seasons?.[0]?.episodes?.[0];
    const resume = firstEpisode ? getWatchProgress(anime.id, `${firstEpisode.season || 1}-${firstEpisode.number}`) : null;
    const nextTarget = resume?.currentTime ? firstEpisode : firstEpisode;
    const watchHref = nextTarget ? watchUrl(anime.id, nextTarget.season || 1, nextTarget.number || 1) : "#";

    heroRoot.innerHTML = `
      <div class="detail-hero__content">
        <span class="hero-banner__eyebrow">${anime.titleOriginal || anime.type || "Anime TV"}</span>
        <h1>${anime.title}</h1>
        <p>${anime.synopsis || anime.summary || "Chưa có mô tả."}</p>
        <div class="hero-banner__chips">
          <span class="hero-chip">★ ${Number(anime.rating ?? 0).toFixed(1)}</span>
          <span class="hero-chip">${anime.maturity || "13+"}</span>
          <span class="hero-chip">${(anime.genres ?? []).slice(0, 3).join(" · ")}</span>
        </div>
        <div class="hero-banner__actions">
          <a class="button button--primary" href="${watchHref}">${resume?.currentTime ? "Xem tiếp" : "Phát tập 1"}</a>
          <a class="button button--ghost" href="#detail-episodes">Danh sách tập</a>
        </div>
      </div>
    `;

    renderMetaList(metaRoot, anime);
    renderEpisodeList(episodesRoot, anime, {
      currentSeason: 1,
      currentEpisode: 1
    });

    const related = catalog
      .filter((item) => item.id !== anime.id)
      .filter((item) => (item.genres ?? []).some((genre) => (anime.genres ?? []).includes(genre)))
      .slice(0, 6);

    clearElement(relatedRoot);
    related.forEach((item) => {
      relatedRoot.append(createAnimeCard(item, { compact: true }));
    });

    setStatus(statusRoot, "ready", `Đã tải ${anime.title}.`);
  } catch (error) {
    console.error(error);
    setStatus(statusRoot, "error", `Không tải được anime: ${error.message}`);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDetail, { once: true });
} else {
  initDetail();
}
