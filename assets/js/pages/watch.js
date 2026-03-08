import "../core/app.js";

import { CONFIG } from "../core/config.js";
import { fetchAnime } from "../core/fetcher.js";
import { qs, setStatus } from "../core/dom.js";
import { getParam, getNumberParam, watchUrl } from "../core/router.js";
import { getAdjacentEpisodes, renderEpisodeList } from "../components/episode-list.js";
import { initAnimePlayer } from "../player/player.js";

const renderWatchInfo = (root, anime, currentEpisode, adjacent) => {
  root.innerHTML = `
    <div class="watch-info__header">
      <div>
        <span class="watch-info__eyebrow">${anime.titleOriginal || anime.type || "Anime streaming"}</span>
        <h1>${anime.title} — Tập ${currentEpisode.number}</h1>
        <p>${currentEpisode.title}</p>
      </div>
      <div class="watch-info__actions">
        ${
          adjacent.previous
            ? `<a class="button button--ghost" href="${watchUrl(anime.id, adjacent.previous.season, adjacent.previous.number)}">← Tập trước</a>`
            : ""
        }
        ${
          adjacent.next
            ? `<a class="button button--primary" href="${watchUrl(anime.id, adjacent.next.season, adjacent.next.number)}">Tập kế →</a>`
            : ""
        }
      </div>
    </div>

    <p class="watch-info__summary">${currentEpisode.overview || anime.synopsis || "Chưa có mô tả cho tập này."}</p>

    <ul class="watch-info__meta">
      <li><span>Season</span><strong>${currentEpisode.season}</strong></li>
      <li><span>Tập</span><strong>${currentEpisode.number}</strong></li>
      <li><span>Thời lượng</span><strong>${currentEpisode.duration || "Đang cập nhật"}</strong></li>
      <li><span>Sub</span><strong>${(currentEpisode.subtitles ?? []).map((item) => item.lang).join(", ").toUpperCase() || "Không có"}</strong></li>
      <li><span>Thể loại</span><strong>${(anime.genres ?? []).join(", ")}</strong></li>
    </ul>
  `;
};

const initWatchPage = async () => {
  const animeId = getParam("id");
  const season = getNumberParam("season", 1);
  const episodeNumber = getNumberParam("ep", 1);

  const statusRoot = qs("#watch-status");
  const video = qs("#anime-player");
  const playerShell = qs("#player-shell");
  const episodeRoot = qs("#watch-episodes");
  const infoRoot = qs("#watch-info");

  if (!animeId) {
    globalThis.location.href = CONFIG.routes.notFound;
    return;
  }

  try {
    setStatus(statusRoot, "loading", "Đang tải video...");
    const anime = await fetchAnime(animeId);

    renderEpisodeList(episodeRoot, anime, {
      currentSeason: season,
      currentEpisode: episodeNumber
    });

    const adjacent = getAdjacentEpisodes(anime, season, episodeNumber);
    const currentEpisode = adjacent.current;

    if (!currentEpisode) {
      throw new Error("Không tìm thấy tập yêu cầu.");
    }

    renderWatchInfo(infoRoot, anime, currentEpisode, adjacent);

    await initAnimePlayer({
      video,
      shell: playerShell,
      anime,
      episode: currentEpisode,
      nextEpisode: adjacent.next
    });

    setStatus(statusRoot, "ready", `Đang phát ${anime.title} tập ${currentEpisode.number}.`);
  } catch (error) {
    console.error(error);
    setStatus(statusRoot, "error", `Không phát được video: ${error.message}`);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWatchPage, { once: true });
} else {
  initWatchPage();
}
