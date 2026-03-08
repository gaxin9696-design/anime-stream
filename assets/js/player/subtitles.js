import { CONFIG, resolveMediaUrl } from "../core/config.js";

export const mountSubtitleTracks = (video, tracks = []) => {
  Array.from(video.querySelectorAll("track")).forEach((track) => track.remove());

  tracks.forEach((track, index) => {
    const node = document.createElement("track");
    node.kind = track.kind || "subtitles";
    node.label = track.label || `Subtitle ${index + 1}`;
    node.srclang = track.lang || "vi";
    node.src = resolveMediaUrl(track.src);
    node.default = Boolean(track.default);
    video.append(node);
  });

  return listSubtitleOptions(video);
};

export const listSubtitleOptions = (video) => [
  { value: "off", label: "Tắt phụ đề" },
  ...Array.from(video.textTracks).map((track, index) => ({
    value: String(index),
    label: track.label || track.language || `Track ${index + 1}`
  }))
];

export const selectSubtitleTrack = (video, value = "off") => {
  Array.from(video.textTracks).forEach((track, index) => {
    track.mode = String(index) === String(value) ? "showing" : "disabled";
  });

  if (value === "off") {
    Array.from(video.textTracks).forEach((track) => {
      track.mode = "disabled";
    });
  }

  return value;
};

export const pickDefaultSubtitle = (video, preferredLanguage = CONFIG.defaults.preferredSubtitle) => {
  const tracks = Array.from(video.textTracks);
  if (!tracks.length) {
    return "off";
  }

  const preferredIndex = tracks.findIndex((track) => track.language === preferredLanguage);
  const indexToUse = preferredIndex >= 0 ? preferredIndex : 0;
  selectSubtitleTrack(video, String(indexToUse));
  return String(indexToUse);
};

export const getActiveSubtitle = (video) => {
  const index = Array.from(video.textTracks).findIndex((track) => track.mode === "showing");
  return index >= 0 ? String(index) : "off";
};
