import { resolveMediaUrl } from "../core/config.js";
import { watchUrl } from "../core/router.js";
import { createPlayerControls } from "../components/player-controls.js";
import { createHlsPlayer } from "./hls-player.js";
import { getWatchProgress, saveWatchProgress } from "./history.js";
import { buildQualityOptions } from "./quality.js";
import {
  getActiveSubtitle,
  listSubtitleOptions,
  mountSubtitleTracks,
  pickDefaultSubtitle,
  selectSubtitleTrack
} from "./subtitles.js";

export const initAnimePlayer = async ({
  video,
  shell,
  anime,
  episode,
  nextEpisode = null
}) => {
  if (!video) {
    throw new Error("Thiếu thẻ <video> để khởi tạo player.");
  }

  const playerShell = shell || video.closest(".player-shell") || video.parentElement;
  playerShell.classList.add("player-shell");

  video.controls = false;
  video.playsInline = true;
  video.preload = "metadata";
  video.poster = resolveMediaUrl(episode.thumbnail || anime.backdrop || anime.cover || anime.poster);

  let backend = null;

  const controls = createPlayerControls(playerShell, {
    video,
    title: `${anime.title} · Tập ${episode.number} — ${episode.title}`,
    onQualityChange(value) {
      backend?.setQuality?.(value);
      controls.setCurrentQuality(value);
    },
    onSubtitleChange(value) {
      selectSubtitleTrack(video, value);
      controls.setCurrentSubtitle(value);
    },
    onNext: nextEpisode
      ? () => {
          globalThis.location.href = watchUrl(anime.id, nextEpisode.season, nextEpisode.number);
        }
      : null
  });

  controls.setLoading(true);

  backend = await createHlsPlayer(video, resolveMediaUrl(episode.stream.master), {
    onReady(data, hls) {
      const qualityOptions = buildQualityOptions(hls.levels);
      controls.setQualityOptions(qualityOptions);
      controls.setCurrentQuality(-1);
      controls.setLoading(false);

      if (anime.autoplay || false) {
        video.play().catch(() => {});
      }
    },
    onError(data, recovered) {
      controls.showToast(
        recovered
          ? "Stream bị lỗi, đang tự phục hồi..."
          : `Lỗi phát video: ${data?.details || data?.type || "không xác định"}`
      );
    },
    onWarning(data) {
      console.warn("HLS warning", data);
    }
  });

  mountSubtitleTracks(video, episode.subtitles ?? []);
  controls.setSubtitleOptions(listSubtitleOptions(video));

  video.addEventListener(
    "loadedmetadata",
    () => {
      const freshSubtitleOptions = listSubtitleOptions(video);
      controls.setSubtitleOptions(freshSubtitleOptions);

      if (freshSubtitleOptions.length > 1) {
        const active = pickDefaultSubtitle(video);
        controls.setCurrentSubtitle(active);
      }

      const episodeStorageKey = `${episode.season}-${episode.number}`;
      const progress = getWatchProgress(anime.id, episodeStorageKey);
      const duration = Number(video.duration ?? 0);
      const resumeAllowed =
        progress?.currentTime &&
        progress.currentTime > 15 &&
        progress.currentTime < Math.max(duration - 30, 15);

      if (resumeAllowed) {
        video.currentTime = progress.currentTime;
        controls.showToast(`Tiếp tục từ ${Math.floor(progress.currentTime)} giây`);
      }
    },
    { once: true }
  );

  let lastPersist = 0;
  const persistProgress = () => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      return;
    }

    saveWatchProgress({
      animeId: anime.id,
      episodeId: `${episode.season}-${episode.number}`,
      season: episode.season,
      episode: episode.number,
      title: anime.title,
      episodeTitle: episode.title,
      poster: anime.poster,
      path: watchUrl(anime.id, episode.season, episode.number),
      currentTime: video.currentTime,
      duration: video.duration
    });
  };

  video.addEventListener("timeupdate", () => {
    if (video.currentTime - lastPersist >= 5) {
      persistProgress();
      lastPersist = video.currentTime;
    }
  });

  video.addEventListener("pause", persistProgress);
  video.addEventListener("ended", () => {
    persistProgress();
    controls.showToast(nextEpisode ? "Đã phát xong, có thể chuyển tập kế." : "Đã phát hết tập.");
  });

  return {
    controls,
    backend,
    destroy() {
      persistProgress();
      controls.destroy();
      backend?.destroy?.();
    },
    getActiveSubtitle() {
      return getActiveSubtitle(video);
    }
  };
};
