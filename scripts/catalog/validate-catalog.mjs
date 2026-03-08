import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const catalogFile = path.join(rootDir, "data", "catalog.json");
const animeDataDir = path.join(rootDir, "data", "anime");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const existsFromPublicPath = (value = "") => fs.existsSync(path.join(rootDir, value.replace(/^\/+/, "")));

const errors = [];
const warnings = [];

const catalogPayload = readJson(catalogFile);
const catalog = Array.isArray(catalogPayload) ? catalogPayload : catalogPayload.items ?? [];

const seenIds = new Set();

catalog.forEach((item) => {
  if (!item.id) {
    errors.push("Một item trong catalog thiếu id.");
    return;
  }

  if (seenIds.has(item.id)) {
    errors.push(`Trùng id trong catalog: ${item.id}`);
  }

  seenIds.add(item.id);

  if (!existsFromPublicPath(item.poster)) {
    warnings.push(`Poster không tồn tại: ${item.poster} (${item.id})`);
  }

  const animeFile = path.join(animeDataDir, `${item.id}.json`);
  if (!fs.existsSync(animeFile)) {
    errors.push(`Thiếu file data/anime/${item.id}.json`);
    return;
  }

  const anime = readJson(animeFile);
  if (anime.id !== item.id) {
    errors.push(`ID trong ${item.id}.json không khớp catalog (${anime.id} !== ${item.id})`);
  }

  (anime.seasons ?? []).forEach((season) => {
    (season.episodes ?? []).forEach((episode) => {
      if (!episode.stream?.master) {
        errors.push(`${item.id} S${season.number}E${episode.number} thiếu stream.master`);
      } else if (!existsFromPublicPath(episode.stream.master)) {
        errors.push(`Thiếu manifest: ${episode.stream.master}`);
      }

      (episode.subtitles ?? []).forEach((subtitle) => {
        if (!existsFromPublicPath(subtitle.src)) {
          warnings.push(`Thiếu subtitle: ${subtitle.src}`);
        }
      });
    });
  });
});

if (warnings.length) {
  console.log("\n⚠ Warnings");
  warnings.forEach((warning) => console.log(`- ${warning}`));
}

if (errors.length) {
  console.log("\n✖ Errors");
  errors.forEach((error) => console.log(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`✔ Catalog hợp lệ (${catalog.length} anime, ${warnings.length} warning).`);
}
