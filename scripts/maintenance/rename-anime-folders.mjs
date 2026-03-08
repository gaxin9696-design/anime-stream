import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const mediaDir = path.join(rootDir, "media", "anime");
const dataDir = path.join(rootDir, "data", "anime");
const apply = process.argv.includes("--apply");

const slugify = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const walkReplace = (input, searchValue, replaceValue) => {
  if (Array.isArray(input)) {
    return input.map((item) => walkReplace(item, searchValue, replaceValue));
  }

  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, walkReplace(value, searchValue, replaceValue)])
    );
  }

  if (typeof input === "string") {
    return input.replaceAll(`/${searchValue}/`, `/${replaceValue}/`);
  }

  return input;
};

const actions = [];

for (const folderName of fs.readdirSync(mediaDir)) {
  const nextName = slugify(folderName);
  if (folderName !== nextName) {
    actions.push({
      type: "media",
      from: path.join(mediaDir, folderName),
      to: path.join(mediaDir, nextName)
    });
  }
}

for (const fileName of fs.readdirSync(dataDir).filter((fileName) => fileName.endsWith(".json"))) {
  const filePath = path.join(dataDir, fileName);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const currentSlug = fileName.replace(/\.json$/i, "");
  const nextSlug = slugify(data.id || data.slug || data.title || currentSlug);

  if (currentSlug !== nextSlug || data.id !== nextSlug || data.slug !== nextSlug) {
    actions.push({
      type: "data",
      from: filePath,
      to: path.join(dataDir, `${nextSlug}.json`),
      currentSlug,
      nextSlug,
      payload: walkReplace(
        {
          ...data,
          id: nextSlug,
          slug: nextSlug
        },
        currentSlug,
        nextSlug
      )
    });
  }
}

if (!actions.length) {
  console.log("✔ Không có folder hoặc file nào cần rename.");
  process.exit(0);
}

console.log(apply ? "Sẽ áp dụng rename:" : "Dry run rename:");
actions.forEach((action) => {
  console.log(`- [${action.type}] ${action.from} -> ${action.to}`);
});

if (!apply) {
  console.log("\nChạy lại với --apply để thực hiện thật.");
  process.exit(0);
}

actions
  .filter((action) => action.type === "media")
  .forEach((action) => {
    fs.renameSync(action.from, action.to);
  });

actions
  .filter((action) => action.type === "data")
  .forEach((action) => {
    fs.writeFileSync(action.to, JSON.stringify(action.payload, null, 2));
    if (action.from !== action.to) {
      fs.rmSync(action.from, { force: true });
    }
  });

console.log("✔ Đã rename xong.");
