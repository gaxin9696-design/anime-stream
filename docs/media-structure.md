# Media Structure

## Cấu trúc khuyến nghị

```text
media/anime/<anime-id>/
├── poster.jpg
├── cover.jpg
├── backdrop.jpg
├── subtitles/
│   ├── e01.vi.vtt
│   ├── e01.en.vtt
│   ├── e02.vi.vtt
│   └── e02.en.vtt
└── s01/
    ├── e01/
    │   ├── master.m3u8
    │   ├── thumbnails.vtt
    │   ├── thumbnail.jpg
    │   ├── 360p/
    │   ├── 720p/
    │   └── 1080p/
    └── e02/
```

## Quy ước đặt tên

- folder anime: `kebab-case`
- season: `s01`, `s02`, ...
- episode: `e01`, `e02`, ...
- subtitles: `e01.vi.vtt`, `e01.en.vtt`

## HLS output

Mỗi episode nên có:

- `master.m3u8`: manifest tổng
- `360p/index.m3u8`
- `720p/index.m3u8`
- `1080p/index.m3u8`
- `seg_000.ts`, `seg_001.ts`, ...

## Ảnh

- `poster.jpg`: dùng cho card và listing
- `cover.jpg`: dùng nếu muốn hero mềm hơn
- `backdrop.jpg`: dùng cho detail/watch hero

## Subtitle

Khuyến nghị WebVTT:

```text
WEBVTT

00:00:00.000 --> 00:00:03.000
Xin chào.
```

## Cache

- `.ts`: cache dài
- `.m3u8`: cache ngắn
- `.vtt`: cache ngắn hoặc vừa
