import "../core/app.js";

import { fetchCatalog, fetchHomepage } from "../core/fetcher.js";
import { createHistoryCard, renderAnimeGrid } from "../components/card.js";
import { clearElement, createElement, qs, setStatus } from "../core/dom.js";
import { detailUrl, watchUrl } from "../core/router.js";
import { listRecentlyWatched } from "../player/history.js";
import { pickByIds } from "../core/utils.js";
import { CONFIG, resolveMediaUrl } from "../core/config.js";

const renderHero = (root, anime, heroConfig = {}) => {
  if (!root || !anime) {
    return;
  }

  root.style.setProperty("--hero-image", `url("${resolveMediaUrl(anime.backdrop || anime.cover || anime.poster || CONFIG.bannerFallback)}")`);
  root.innerHTML = `
    <div class="hero-banner__content">
      <span class="hero-banner__eyebrow">${heroConfig.eyebrow || "Mini Netflix anime"}</span>
      <h1>${heroConfig.headline || anime.title}</h1>
      <p>${heroConfig.description || anime.summary || "Xây bằng static files, HLS và Cloudflare."}</p>

      <div class="hero-banner__chips">
        <span class="hero-chip">★ ${Number(anime.rating ?? 0).toFixed(1)}</span>
        <span class="hero-chip">${anime.year || "N/A"}</span>
        <span class="hero-chip">${(anime.genres ?? []).slice(0, 3).join(" · ") || "Anime"}</span>
      </div>

      <div class="hero-banner__actions">
        <a class="button button--primary" href="${watchUrl(anime.id, 1, 1)}">Phát ngay</a>
        <a class="button button--ghost" href="${detailUrl(anime.id)}">Xem chi tiết</a>
      </div>
    </div>
  `;
};

const renderSection = (root, title, description, items) => {
  if (!root) {
    return;
  }

  const section = createElement("section", { className: "content-section" });
  section.innerHTML = `
    <div class="section-heading">
      <div>
        <h2>${title}</h2>
        <p>${description || "Bộ sưu tập anime demo có thể thay bằng catalog thật của bạn."}</p>
      </div>
    </div>
  `;

  const grid = createElement("div", { className: "anime-grid" });
  renderAnimeGrid(grid, items);
  section.append(grid);
  root.append(section);
};

const renderContinueWatching = (root) => {
  if (!root) {
    return;
  }

  clearElement(root);
  const history = listRecentlyWatched(6);
  if (!history.length) {
    root.innerHTML = `
      <div class="empty-state">
        <h3>Chưa có lịch sử xem</h3>
        <p>Bấm vào một tập bất kỳ để lưu tiến độ và hiện tiếp tục xem ở đây.</p>
      </div>
    `;
    return;
  }

  history.forEach((entry) => {
    root.append(createHistoryCard(entry));
  });
};

const initHome = async () => {
  const heroRoot = qs("#hero-banner");
  const sectionsRoot = qs("#home-sections");
  const continueRoot = qs("#continue-watching");
  const statusRoot = qs("#home-status");

  try {
    setStatus(statusRoot, "loading", "Đang tải catalog...");

    const [catalog, homepage] = await Promise.all([fetchCatalog(), fetchHomepage()]);

    const heroAnime =
      catalog.find((anime) => anime.id === homepage.hero?.animeId) || catalog[0];

    renderHero(heroRoot, heroAnime, homepage.hero);
    clearElement(sectionsRoot);

    (homepage.sections ?? []).forEach((section) => {
      const items = section.ids?.length ? pickByIds(catalog, section.ids) : catalog.slice(0, 6);
      renderSection(sectionsRoot, section.title, section.description, items);
    });

    renderContinueWatching(continueRoot);
    setStatus(statusRoot, "ready", `Đã tải ${catalog.length} anime.`);
  } catch (error) {
    console.error(error);
    setStatus(statusRoot, "error", `Không tải được trang chủ: ${error.message}`);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHome, { once: true });
} else {
  initHome();
}
