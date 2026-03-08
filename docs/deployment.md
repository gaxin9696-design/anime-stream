# Deployment

## Mô hình đề xuất

- Frontend: Cloudflare Pages
- Media: Cloudflare R2
- Domain media: custom domain trỏ bucket R2
- Cache purge: Cloudflare API

## Chuẩn bị

1. Tạo bucket R2
2. Bật public bucket hoặc custom domain
3. Tạo Pages project
4. Tạo `.env` từ `.env.example`

## Upload media

```bash
node scripts/deploy/upload-r2.mjs --dir media
```

Hoặc upload cả data:

```bash
node scripts/deploy/upload-r2.mjs --dir media --dir data
```

## Deploy Pages

```bash
npm run pages:prepare
npm run pages:deploy
```

## Khi cập nhật episode mới

1. Encode video mới
2. Update `data/anime/<id>.json`
3. `npm run catalog:generate`
4. Upload file mới lên R2
5. Purge `master.m3u8` hoặc `catalog.json` nếu cần
6. Deploy lại frontend nếu JSON nằm trên Pages

## Mẹo

- Nếu data cũng nằm trên R2, set `DATA_BASE_URL`
- Nếu chỉ media trên R2, giữ `DATA_BASE_URL=/data`
- Không nên đưa nhiều `.ts` lên Pages vì file count sẽ tăng rất nhanh
