# Architecture

## Tổng quan

```text
Người xem
  ↓
Cloudflare Pages (HTML/CSS/JS)
  ↓ fetch JSON
data/catalog.json + data/anime/*.json
  ↓
HLS.js player
  ↓
Cloudflare R2 / custom domain CDN
  ↓
.m3u8 + .ts + .vtt
```

## Thành phần

### Frontend

- `index.html`, `views/*.html`
- `assets/css/*.css`
- `assets/js/core/*`
- `assets/js/pages/*`
- `assets/js/components/*`
- `assets/js/player/*`

Frontend hoàn toàn tĩnh, không cần backend.

### Data layer

- `data/catalog.json`: list tóm tắt để render home/search
- `data/homepage.json`: config sections trang chủ
- `data/genres.json`: filter
- `data/anime/*.json`: metadata đầy đủ từng anime

### Media layer

- `media/anime/<slug>/poster.jpg`
- `media/anime/<slug>/backdrop.jpg`
- `media/anime/<slug>/subtitles/*.vtt`
- `media/anime/<slug>/s01/e01/master.m3u8`
- `media/anime/<slug>/s01/e01/360p/*.ts`
- `media/anime/<slug>/s01/e01/720p/*.ts`
- `media/anime/<slug>/s01/e01/1080p/*.ts`

### Tooling

- `scripts/encode/*`: encode HLS bằng FFmpeg
- `scripts/catalog/*`: generate / validate metadata
- `scripts/deploy/*`: upload R2, purge cache, deploy Pages
- `scripts/maintenance/*`: kiểm tra thiếu file, rename, cleanup

## Luồng dữ liệu

1. Người dùng vào `/`
2. `home.js` fetch `data/catalog.json` và `data/homepage.json`
3. Người dùng chọn anime
4. `detail.js` fetch `data/anime/<id>.json`
5. Người dùng mở watch page
6. `watch.js` lấy `stream.master`
7. `player.js` khởi tạo HLS.js và custom controls
8. `history.js` lưu progress vào localStorage

## Lý do kiến trúc này phù hợp

- không cần backend
- rẻ, dễ deploy
- thay media và JSON là chạy
- phù hợp site nhỏ / demo / internal / licensed library
