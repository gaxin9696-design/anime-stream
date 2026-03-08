import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config();

const rootDir = process.cwd();
const outputDir = path.join(rootDir, ".deploy", "pages");

const parseArgs = (argv = []) => ({
  deploy: argv.includes("--deploy"),
  prepareOnly: argv.includes("--prepare-only"),
  withMedia: argv.includes("--with-media"),
  noData: argv.includes("--no-data")
});

const args = parseArgs(process.argv.slice(2));

const removeDir = (dirPath) => {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
};

const copyRecursive = (fromPath, toPath) => {
  const stats = fs.statSync(fromPath);

  if (stats.isDirectory()) {
    fs.mkdirSync(toPath, { recursive: true });
    fs.readdirSync(fromPath).forEach((entry) => {
      copyRecursive(path.join(fromPath, entry), path.join(toPath, entry));
    });
    return;
  }

  fs.mkdirSync(path.dirname(toPath), { recursive: true });
  fs.copyFileSync(fromPath, toPath);
};

const rewriteHtmlRuntimeConfig = (filePath) => {
  let html = fs.readFileSync(filePath, "utf8");

  const replacements = {
    'dataBaseUrl: "/data"': `dataBaseUrl: "${process.env.DATA_BASE_URL || "/data"}"`,
    'mediaBaseUrl: "/media"': `mediaBaseUrl: "${process.env.MEDIA_BASE_URL || "/media"}"`,
    'cdnBaseUrl: ""': `cdnBaseUrl: "${process.env.CDN_BASE_URL || ""}"`,
    'siteTagline: "Streaming anime static + HLS + Cloudflare R2"':
      `siteTagline: "${process.env.SITE_TAGLINE || "Streaming anime static + HLS + Cloudflare R2"}"`
  };

  Object.entries(replacements).forEach(([searchValue, replaceValue]) => {
    html = html.replace(searchValue, replaceValue);
  });

  fs.writeFileSync(filePath, html);
};

const rewriteIfExists = (relativePath, transform) => {
  const fullPath = path.join(outputDir, relativePath);
  if (fs.existsSync(fullPath)) {
    transform(fullPath);
  }
};

removeDir(outputDir);

const staticEntries = [
  "index.html",
  "404.html",
  "assets",
  "views",
  "public"
];

if (!args.noData) {
  staticEntries.push("data");
}

if (args.withMedia) {
  staticEntries.push("media");
}

staticEntries.forEach((entry) => {
  const source = path.join(rootDir, entry);
  if (fs.existsSync(source)) {
    copyRecursive(source, path.join(outputDir, entry));
  }
});

["robots.txt", "sitemap.xml", "favicon.ico"].forEach((name) => {
  const fromPublic = path.join(outputDir, "public", name);
  const destination = path.join(outputDir, name);

  if (fs.existsSync(fromPublic)) {
    fs.copyFileSync(fromPublic, destination);
  } else {
    const fromRoot = path.join(rootDir, name);
    if (fs.existsSync(fromRoot)) {
      fs.copyFileSync(fromRoot, destination);
    }
  }
});

const siteBaseUrl = process.env.SITE_BASE_URL || "https://anime.example.com";
rewriteIfExists("public/sitemap.xml", (filePath) => {
  const xml = fs.readFileSync(filePath, "utf8").replaceAll("https://anime.example.com", siteBaseUrl);
  fs.writeFileSync(filePath, xml);
});
rewriteIfExists("sitemap.xml", (filePath) => {
  const xml = fs.readFileSync(filePath, "utf8").replaceAll("https://anime.example.com", siteBaseUrl);
  fs.writeFileSync(filePath, xml);
});

const htmlFiles = [];

const collectHtmlFiles = (dirPath) => {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectHtmlFiles(fullPath);
      continue;
    }

    if (entry.name.endsWith(".html")) {
      htmlFiles.push(fullPath);
    }
  }
};

collectHtmlFiles(outputDir);
htmlFiles.forEach(rewriteHtmlRuntimeConfig);

console.log(`✔ Đã chuẩn bị thư mục deploy tại: ${outputDir}`);

if (args.prepareOnly || !args.deploy) {
  process.exit(0);
}

const projectName = process.env.CLOUDFLARE_PAGES_PROJECT;
if (!projectName) {
  console.error("Thiếu CLOUDFLARE_PAGES_PROJECT trong .env");
  process.exit(1);
}

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["wrangler", "pages", "deploy", outputDir, "--project-name", projectName],
  {
    cwd: rootDir,
    stdio: "inherit",
    env: {
      ...process.env,
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || "",
      CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || ""
    }
  }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
