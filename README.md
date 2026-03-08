# Anime Stream

Project mẫu cho web anime streaming tĩnh kiểu "Netflix mini" dùng:

- **Frontend:** HTML/CSS/JS thuần
- **Player:** HLS.js + custom controls
- **Storage:** Cloudflare R2
- **Hosting:** Cloudflare Pages
- **Encode:** FFmpeg (PowerShell script cho Windows)

> Lưu ý pháp lý: chỉ host nội dung bạn **sở hữu** hoặc **được cấp phép**. Bộ media trong repo này chỉ là demo tự tạo để test pipeline, không chứa anime bản quyền thật.

---

## 1) Chạy local nhanh nhất

### Yêu cầu

- Node.js 20+
- npm
- FFmpeg (để encode video thật sau này)

### Cài và chạy

```bash
npm install
npm run dev
```

Mở:

```text
http://localhost:8788
```

Trang demo có sẵn:

- `/`
- `/views/detail.html?id=attack-on-titan`
- `/views/watch.html?id=attack-on-titan&season=1&ep=1`
- `/views/search.html`

---

## 2) Cấu trúc chính

- `assets/`: CSS, JS, ảnh UI, icon
- `data/`: catalog, genres, metadata từng anime
- `media/`: poster, backdrop, phụ đề, HLS manifests và segments
- `scripts/encode/`: encode video sang HLS
- `scripts/catalog/`: sinh catalog và validate metadata
- `scripts/deploy/`: upload R2, purge cache, deploy Pages
- `docs/`: tài liệu kiến trúc và triển khai

---

## 3) Encode 1 tập anime sang HLS

### Encode một tập

```powershell
powershell -ExecutionPolicy Bypass -File scripts/encode/build-hls.ps1 `
  -Input "D:\Anime\episode01.mp4" `
  -Output "media/anime/your-anime/s01/e01"
```

Output sẽ có dạng:

```text
media/anime/your-anime/s01/e01/
├── master.m3u8
├── thumbnails.vtt
├── thumbnail.jpg
├── 360p/
├── 720p/
└── 1080p/
```

### Encode hàng loạt

```powershell
powershell -ExecutionPolicy Bypass -File scripts/encode/batch-encode.ps1 `
  -InputDir "D:\Anime\Season1" `
  -AnimeId "your-anime" `
  -Season 1 `
  -StartEpisode 1
```

---

## 4) Thêm anime mới

1. Tạo folder media:

```text
media/anime/your-anime/
├── poster.jpg
├── cover.jpg
├── backdrop.jpg
├── subtitles/
└── s01/
```

2. Encode các tập vào `media/anime/your-anime/s01/e01`, `e02`, ...

3. Tạo metadata:

```text
data/anime/your-anime.json
```

4. Sinh lại catalog:

```bash
npm run catalog:generate
npm run catalog:validate
```

Nếu chưa có poster/cover/backdrop, chạy:

```bash
npm run catalog:sync-posters
```

---

## 5) Upload media lên Cloudflare R2

### Bước 1: tạo file `.env`

Copy từ `.env.example`:

```bash
cp .env.example .env
```

Điền các biến:

- `R2_ACCOUNT_ID`
- `R2_ENDPOINT`
- `R2_BUCKET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

### Bước 2: upload

Chỉ upload media:

```bash
npm run r2:upload
```

Upload cả `data` và `media`:

```bash
node scripts/deploy/upload-r2.mjs --dir data --dir media
```

Dry run:

```bash
node scripts/deploy/upload-r2.mjs --dir media --dry-run
```

---

## 6) Deploy frontend lên Cloudflare Pages

### Chuẩn bị thư mục deploy

```bash
npm run pages:prepare
```

Thư mục output:

```text
.deploy/pages
```

### Deploy trực tiếp bằng Wrangler

Điền thêm vào `.env`:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_PAGES_PROJECT`
- `CDN_BASE_URL` (domain public của bucket R2 hoặc custom domain CDN)

Sau đó chạy:

```bash
npm run pages:deploy
```

Script deploy sẽ:

- copy đúng file cần lên `.deploy/pages`
- inject `CDN_BASE_URL`, `DATA_BASE_URL`, `MEDIA_BASE_URL` vào HTML
- copy `robots.txt`, `sitemap.xml`, `favicon.ico` ra root deploy
- gọi `wrangler pages deploy`

---

## 7) Purge cache sau khi cập nhật video

Purge toàn bộ zone:

```bash
node scripts/deploy/purge-cache.mjs --everything
```

Purge file cụ thể:

```bash
node scripts/deploy/purge-cache.mjs \
  --file https://cdn.example.com/media/anime/your-anime/s01/e01/master.m3u8
```

---

## 8) Các lệnh hay dùng

```bash
npm run dev
npm run catalog:generate
npm run catalog:validate
npm run catalog:sync-posters
npm run maint:check
npm run maint:rename
npm run maint:cleanup
npm run r2:upload
npm run pages:prepare
npm run pages:deploy
```

---

## 9) Chỉnh domain media/CDN

Nếu bạn upload media lên domain CDN riêng, set trong `.env`:

```env
CDN_BASE_URL=https://cdn.example.com
```

Hoặc sửa trực tiếp trong `window.ANIME_STREAM_CONFIG` bên trong HTML nếu muốn test tay.

---

## 10) Player hiện có gì

- HLS adaptive stream
- Chọn chất lượng
- Bật/tắt phụ đề
- Chỉnh tốc độ
- Fullscreen
- Picture-in-Picture
- Keyboard shortcuts:
  - `Space` / `K`: play/pause
  - `←` / `→`: tua 5 giây
  - `M`: mute
  - `F`: fullscreen
  - `C`: bật/tắt subtitle
- Lưu tiến độ xem bằng localStorage

---

## 11) Dữ liệu demo trong repo

Repo đã có sẵn:

- 3 anime demo
- poster / cover / backdrop placeholder
- subtitles mẫu `.vtt`
- stream HLS demo ngắn để bạn mở lên là xem được ngay

Bạn chỉ cần thay media demo bằng video thật của bạn sau này.

---

## 12) Workflow khuyến nghị

1. Encode video bằng FFmpeg
2. Tạo / cập nhật `data/anime/*.json`
3. Chạy `npm run catalog:generate`
4. Chạy `npm run catalog:validate`
5. Upload `media/` lên R2
6. Set `CDN_BASE_URL`
7. Deploy Pages

---

## 13) Gợi ý vận hành thật

- Host frontend trên Pages
- Host media trên R2 custom domain
- Không để video segment trên Pages nếu catalog lớn
- Cache mạnh với `.ts`, cache ngắn với `.m3u8` và `.json`
- Sau khi upload bản mới thì purge `master.m3u8` và JSON

---

## 14) File nào cần sửa khi dùng thực tế?

Ít nhất bạn sẽ sửa:

- `.env`
- `data/anime/*.json`
- `data/homepage.json`
- `media/anime/<anime-id>/...`

Phần code frontend, scripts và player có thể dùng lại nguyên trạng.

