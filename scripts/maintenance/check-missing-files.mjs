import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const animeDataDir = path.join(rootDir, "data", "anime");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const exists = (publicPath = "") => fs.existsSync(path.join(rootDir, publicPath.replace(/^\/+/, "")));

const report = [];

for (const fileName of fs.readdirSync(animeDataDir).filter((fileName) => fileName.endsWith(".json"))) {
  const anime = readJson(path.join(animeDataDir, fileName));
  const issues = [];

  ["poster", "cover", "backdrop"].forEach((field) => {
    if (!exists(anime[field])) {
      issues.push(`Thiếu ${field}: ${anime[field]}`);
    }
  });

  (anime.seasons ?? []).forEach((season) => {
    (season.episodes ?? []).forEach((episode) => {
      if (!exists(episode.stream?.master || "")) {
        issues.push(`Thiếu manifest: ${episode.stream?.master || "(empty)"}`);
      }

      (episode.subtitles ?? []).forEach((subtitle) => {
        if (!exists(subtitle.src)) {
          issues.push(`Thiếu subtitle: ${subtitle.src}`);
        }
      });
    });
  });

  report.push({
    id: anime.id,
    issues
  });
}

const problems = report.filter((item) => item.issues.length > 0);

if (!problems.length) {
  console.log("✔ Không phát hiện file thiếu.");
  process.exit(0);
}

problems.forEach((item) => {
  console.log(`\n${item.id}`);
  item.issues.forEach((issue) => console.log(`- ${issue}`));
});

process.exitCode = 1;
