import { clearElement, createElement } from "../core/dom.js";
import { watchUrl } from "../core/router.js";
import { escapeHtml, formatSeasonEpisode, formatTime } from "../core/utils.js";

export const flattenEpisodes = (anime) =>
  (anime.seasons ?? []).flatMap((season) =>
    (season.episodes ?? []).map((episode) => ({
      ...episode,
      season: season.number
    }))
  );

export const findEpisode = (anime, seasonNumber = 1, episodeNumber = 1) =>
  flattenEpisodes(anime).find(
    (episode) => Number(episode.season) === Number(seasonNumber) && Number(episode.number) === Number(episodeNumber)
  );

export const getAdjacentEpisodes = (anime, seasonNumber = 1, episodeNumber = 1) => {
  const episodes = flattenEpisodes(anime);
  const currentIndex = episodes.findIndex(
    (episode) => Number(episode.season) === Number(seasonNumber) && Number(episode.number) === Number(episodeNumber)
  );

  return {
    previous: currentIndex > 0 ? episodes[currentIndex - 1] : null,
    current: currentIndex >= 0 ? episodes[currentIndex] : null,
    next: currentIndex >= 0 && currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null
  };
};

export const renderEpisodeList = (root, anime, options = {}) => {
  if (!root) {
    return;
  }

  clearElement(root);
  const activeSeason = Number(options.currentSeason ?? 1);
  const activeEpisode = Number(options.currentEpisode ?? 1);

  (anime.seasons ?? []).forEach((season) => {
    const block = createElement("section", { className: "episode-block" });
    block.innerHTML = `
      <div class="episode-block__header">
        <h3>${escapeHtml(season.label || `Season ${season.number}`)}</h3>
        <span>${(season.episodes ?? []).length} tập</span>
      </div>
    `;

    const list = createElement("div", { className: "episode-block__list" });

    (season.episodes ?? []).forEach((episode) => {
      const isActive =
        Number(season.number) === activeSeason && Number(episode.number) === activeEpisode;

      const item = createElement("a", {
        className: `episode-item ${isActive ? "is-active" : ""}`.trim(),
        attrs: {
          href: watchUrl(anime.id, season.number, episode.number)
        }
      });

      const durationText =
        typeof episode.durationSeconds === "number"
          ? formatTime(episode.durationSeconds)
          : episode.duration || "TBD";

      item.innerHTML = `
        <span class="episode-item__code">${formatSeasonEpisode(season.number, episode.number)}</span>
        <strong class="episode-item__title">${escapeHtml(episode.title || `Tập ${episode.number}`)}</strong>
        <small class="episode-item__meta">${durationText} · ${escapeHtml(
        episode.badge || "HLS"
      )}</small>
      `;

      list.append(item);
    });

    block.append(list);
    root.append(block);
  });
};
