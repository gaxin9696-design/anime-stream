import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const animeDataDir = path.join(rootDir, "data", "anime");
const animeMediaDir = path.join(rootDir, "media", "anime");
const catalogPath = path.join(rootDir, "data", "catalog.json");
const genresPath = path.join(rootDir, "data", "genres.json");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const ensureArray = (value) => (Array.isArray(value) ? value : []);

const fileExists = (publicPath = "") => {
  const relative = publicPath.replace(/^\/+/, "");
  return fs.existsSync(path.join(rootDir, relative));
};

const buildCatalogItem = (anime) => {
  const seasons = ensureArray(anime.seasons);
  const episodes = seasons.reduce((sum, season) => sum + ensureArray(season.episodes).length, 0);
  const mediaDir = path.join(animeMediaDir, anime.id);

  return {
    id: anime.id,
    slug: anime.slug || anime.id,
    title: anime.title,
    titleOriginal: anime.titleOriginal || "",
    year: anime.year || null,
    rating: anime.rating || 0,
    genres: ensureArray(anime.genres),
    status: anime.status || "Unknown",
    type: anime.type || "TV",
    episodes,
    poster: fileExists(anime.poster) ? anime.poster : "/assets/images/placeholders/poster-fallback.jpg",
    cover: anime.cover || anime.poster || "/assets/images/placeholders/poster-fallback.jpg",
    backdrop: anime.backdrop || anime.cover || anime.poster || "/assets/images/banner-home.jpg",
    summary: anime.summary || anime.synopsis || "",
    studio: anime.studio || "",
    maturity: anime.maturity || "13+",
    duration: anime.duration || "",
    popularity: Number(anime.popularity ?? episodes * 10),
    hasMedia: fs.existsSync(mediaDir),
    updatedAt: anime.updatedAt || new Date().toISOString()
  };
};

const animeFiles = fs
  .readdirSync(animeDataDir)
  .filter((fileName) => fileName.endsWith(".json"))
  .sort((left, right) => left.localeCompare(right, "en"));

const catalog = animeFiles.map((fileName) => buildCatalogItem(readJson(path.join(animeDataDir, fileName))));
catalog.sort((left, right) => Number(right.popularity ?? 0) - Number(left.popularity ?? 0));

const genreCounter = new Map();

catalog.forEach((anime) => {
  ensureArray(anime.genres).forEach((genre) => {
    genreCounter.set(genre, (genreCounter.get(genre) || 0) + 1);
  });
});

const genres = [...genreCounter.entries()]
  .map(([name, count]) => ({
    name,
    slug: name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
    count
  }))
  .sort((left, right) => left.name.localeCompare(right.name, "en"));

fs.writeFileSync(
  catalogPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      total: catalog.length,
      items: catalog
    },
    null,
    2
  )
);

fs.writeFileSync(genresPath, JSON.stringify(genres, null, 2));

console.log(`✔ catalog.json: ${catalog.length} anime`);
console.log(`✔ genres.json: ${genres.length} thể loại`);
