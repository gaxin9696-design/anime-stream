import dotenv from "dotenv";

dotenv.config();

const zoneId = process.env.CLOUDFLARE_ZONE_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

const parseArgs = (argv = []) => {
  const args = { file: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--file") {
      args.file.push(argv[index + 1]);
      index += 1;
      continue;
    }

    if (token === "--everything") {
      args.everything = true;
      continue;
    }
  }
  return args;
};

const args = parseArgs(process.argv.slice(2));

if (!zoneId || !apiToken) {
  console.error("Thiếu CLOUDFLARE_ZONE_ID hoặc CLOUDFLARE_API_TOKEN trong .env");
  process.exit(1);
}

if (!args.everything && !args.file.length) {
  console.error("Dùng --everything hoặc thêm ít nhất một --file <URL> để purge.");
  process.exit(1);
}

const endpoint = `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`;
const payload = args.everything ? { purge_everything: true } : { files: args.file };

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
});

const result = await response.json();

if (!response.ok || !result.success) {
  console.error("Purge cache thất bại:", JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log("✔ Purge cache thành công.");
