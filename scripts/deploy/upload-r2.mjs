import fs from "node:fs";
import path from "node:path";
import { lookup as mimeLookup } from "mime-types";
import dotenv from "dotenv";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

dotenv.config();

const rootDir = process.cwd();

const parseArgs = (argv = []) => {
  const args = { dir: [], file: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--dir") {
      args.dir.push(argv[index + 1]);
      index += 1;
      continue;
    }

    if (token === "--prefix") {
      args.prefix = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (token === "--concurrency") {
      args.concurrency = Number(argv[index + 1] || 4);
      index += 1;
      continue;
    }
  }

  return args;
};

const args = parseArgs(process.argv.slice(2));
const sourceDirs = args.dir.length ? args.dir : ["media"];
const prefix = String(args.prefix || "").replace(/^\/+|\/+$/g, "");
const concurrency = Number.isFinite(args.concurrency) && args.concurrency > 0 ? args.concurrency : 4;

const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
const endpoint =
  process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : null);

const bucket = process.env.R2_BUCKET;
const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.R2_KEY;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET;

if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
  console.error("Thiếu cấu hình R2. Kiểm tra .env (R2_BUCKET, R2_ACCOUNT_ID/R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
});

const walkFiles = (dirPath) => {
  const results = [];

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath));
      continue;
    }

    results.push(fullPath);
  }

  return results;
};

const cacheControlFor = (filePath) => {
  if (/\.(m3u8|json|vtt)$/i.test(filePath)) {
    return "public, max-age=60, s-maxage=60, must-revalidate";
  }

  if (/\.(ts|m4s)$/i.test(filePath)) {
    return "public, max-age=31536000, immutable";
  }

  if (/\.(jpg|jpeg|png|webp|svg|ico)$/i.test(filePath)) {
    return "public, max-age=604800";
  }

  return "public, max-age=300";
};

const files = sourceDirs
  .map((dirName) => path.join(rootDir, dirName))
  .filter((dirPath) => fs.existsSync(dirPath))
  .flatMap((dirPath) => walkFiles(dirPath));

if (!files.length) {
  console.error("Không tìm thấy file để upload.");
  process.exit(1);
}

console.log(`Bắt đầu upload ${files.length} file lên bucket ${bucket}...`);

const toObjectKey = (filePath) => {
  const relative = path.relative(rootDir, filePath).split(path.sep).join("/");
  return prefix ? `${prefix}/${relative}` : relative;
};

const uploadFile = async (filePath) => {
  const objectKey = toObjectKey(filePath);
  const contentType = mimeLookup(filePath) || "application/octet-stream";

  if (args.dryRun) {
    console.log(`[dry-run] ${objectKey}`);
    return;
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: fs.createReadStream(filePath),
      ContentType: contentType,
      CacheControl: cacheControlFor(filePath)
    })
  );

  console.log(`✔ ${objectKey}`);
};

const queue = [...files];
const workers = Array.from({ length: Math.min(concurrency, files.length) }).map(async () => {
  while (queue.length) {
    const nextFile = queue.shift();
    if (nextFile) {
      await uploadFile(nextFile);
    }
  }
});

await Promise.all(workers);

console.log("✔ Upload R2 hoàn tất.");
