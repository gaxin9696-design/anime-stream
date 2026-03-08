import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

const removableNames = new Set([
  ".DS_Store",
  "Thumbs.db",
  "desktop.ini"
]);

const removableFolders = [
  path.join(rootDir, ".deploy"),
  path.join(rootDir, "dist"),
  path.join(rootDir, "_temp"),
  path.join(rootDir, "temp")
];

const walk = (dirPath) => {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      if (!fs.readdirSync(fullPath).length) {
        fs.rmdirSync(fullPath);
        console.log(`🧹 Xóa folder rỗng: ${fullPath}`);
      }
      continue;
    }

    if (removableNames.has(entry.name)) {
      fs.rmSync(fullPath, { force: true });
      console.log(`🧹 Xóa file tạm: ${fullPath}`);
    }
  }
};

removableFolders.forEach((folderPath) => {
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
    console.log(`🧹 Xóa folder: ${folderPath}`);
  }
});

walk(rootDir);

console.log("✔ Cleanup hoàn tất.");
