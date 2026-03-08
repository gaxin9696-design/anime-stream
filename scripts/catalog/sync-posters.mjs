import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const rootDir = process.cwd();
const animeDataDir = path.join(rootDir, "data", "anime");
const animeMediaDir = path.join(rootDir, "media", "anime");
const posterFallback = path.join(rootDir, "assets", "images", "placeholders", "poster-fallback.jpg");
const bannerFallback = path.join(rootDir, "assets", "images", "banner-home.jpg");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const writeJson = (filePath, value) => fs.writeFileSync(filePath, JSON.stringify(value, null, 2));

const animeFiles = fs.readdirSync(animeDataDir).filter((fileName) => fileName.endsWith(".json"));

animeFiles.forEach((fileName) => {
  const filePath = path.join(animeDataDir, fileName);
  const anime = readJson(filePath);
  const mediaDir = path.join(animeMediaDir, anime.id);
  fs.mkdirSync(mediaDir, { recursive: true });

  const posterPath = path.join(mediaDir, "poster.jpg");
  const coverPath = path.join(mediaDir, "cover.jpg");
  const backdropPath = path.join(mediaDir, "backdrop.jpg");

  if (!fs.existsSync(posterPath)) {
    fs.copyFileSync(posterFallback, posterPath);
  }

  if (!fs.existsSync(coverPath)) {
    fs.copyFileSync(posterPath, coverPath);
  }

  if (!fs.existsSync(backdropPath)) {
    fs.copyFileSync(bannerFallback, backdropPath);
  }

  anime.poster = `/media/anime/${anime.id}/poster.jpg`;
  anime.cover = `/media/anime/${anime.id}/cover.jpg`;
  anime.backdrop = `/media/anime/${anime.id}/backdrop.jpg`;

  writeJson(filePath, anime);
  console.log(`✔ Đồng bộ ảnh: ${anime.id}`);
});

try {
  execFileSync("node", ["scripts/catalog/catalog-generator.mjs"], {
    cwd: rootDir,
    stdio: "inherit"
  });
} catch (error) {
  console.warn("Không tự generate catalog được sau khi sync poster.", error.message);
}
