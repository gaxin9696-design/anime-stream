# Catalog Schema

## `data/catalog.json`

```json
{
  "generatedAt": "2026-03-07T00:00:00.000Z",
  "total": 3,
  "items": [
    {
      "id": "attack-on-titan",
      "title": "Attack on Titan",
      "year": 2013,
      "rating": 9.1,
      "genres": ["Action", "Drama", "Fantasy"],
      "poster": "/media/anime/attack-on-titan/poster.jpg",
      "backdrop": "/media/anime/attack-on-titan/backdrop.jpg",
      "episodes": 2,
      "summary": "..."
    }
  ]
}
```

## `data/anime/<id>.json`

Các field quan trọng:

- `id`
- `slug`
- `title`
- `titleOriginal`
- `year`
- `rating`
- `genres`
- `poster`
- `cover`
- `backdrop`
- `summary`
- `synopsis`
- `seasons`

## Episode schema

```json
{
  "season": 1,
  "number": 1,
  "title": "Episode title",
  "overview": "Episode summary",
  "duration": "00:24:00",
  "durationSeconds": 1440,
  "stream": {
    "type": "hls",
    "master": "/media/anime/demo/s01/e01/master.m3u8"
  },
  "subtitles": [
    {
      "label": "Tiếng Việt",
      "lang": "vi",
      "src": "/media/anime/demo/subtitles/e01.vi.vtt",
      "default": true
    }
  ]
}
```

## Ghi chú

- `master` phải là đường dẫn public truy cập được
- subtitles nên dùng `.vtt`
- `durationSeconds` giúp player và history hoạt động mượt hơn
