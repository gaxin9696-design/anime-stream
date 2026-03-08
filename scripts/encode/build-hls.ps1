param(
  [Parameter(Mandatory = $true)]
  [string]$Input,

  [Parameter(Mandatory = $true)]
  [string]$Output,

  [string]$PresetFile = "$PSScriptRoot/ffmpeg-presets.json"
)

$ErrorActionPreference = "Stop"

function Assert-CommandExists {
  param([string]$CommandName)

  if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
    throw "Không tìm thấy lệnh $CommandName. Hãy cài FFmpeg trước."
  }
}

Assert-CommandExists -CommandName "ffmpeg"
Assert-CommandExists -CommandName "ffprobe"

if (-not (Test-Path $Input)) {
  throw "Không tìm thấy file input: $Input"
}

if (-not (Test-Path $PresetFile)) {
  throw "Không tìm thấy preset: $PresetFile"
}

$presets = Get-Content $PresetFile -Raw | ConvertFrom-Json
New-Item -ItemType Directory -Force -Path $Output | Out-Null

function Get-OrDefault {
  param(
    $Value,
    $DefaultValue
  )

  if ($null -eq $Value -or $Value -eq "") {
    return $DefaultValue
  }

  return $Value
}

$segmentDuration = [string](Get-OrDefault $presets.segmentDuration 6)
$audioBitrate = [string](Get-OrDefault $presets.audioBitrate "128k")
$videoCodec = [string](Get-OrDefault $presets.videoCodec "libx264")
$audioCodec = [string](Get-OrDefault $presets.audioCodec "aac")
$presetName = [string](Get-OrDefault $presets.preset "veryfast")
$crf = [string](Get-OrDefault $presets.crf 21)

$ffmpegArgs = @(
  "-y",
  "-i", $Input,

  "-map", "0:v:0", "-map", "0:a:0?",
  "-map", "0:v:0", "-map", "0:a:0?",
  "-map", "0:v:0", "-map", "0:a:0?",

  "-c:v", $videoCodec,
  "-preset", $presetName,
  "-crf", $crf,
  "-g", "48",
  "-keyint_min", "48",
  "-sc_threshold", "0",

  "-filter:v:0", "scale=w=640:h=360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2",
  "-b:v:0", "800k",
  "-maxrate:v:0", "856k",
  "-bufsize:v:0", "1200k",

  "-filter:v:1", "scale=w=1280:h=720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
  "-b:v:1", "2800k",
  "-maxrate:v:1", "2996k",
  "-bufsize:v:1", "4200k",

  "-filter:v:2", "scale=w=1920:h=1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
  "-b:v:2", "5000k",
  "-maxrate:v:2", "5350k",
  "-bufsize:v:2", "7500k",

  "-c:a:0", $audioCodec,
  "-c:a:1", $audioCodec,
  "-c:a:2", $audioCodec,
  "-b:a:0", $audioBitrate,
  "-b:a:1", $audioBitrate,
  "-b:a:2", $audioBitrate,
  "-ar", "48000",
  "-ac", "2",

  "-master_pl_name", "master.m3u8",
  "-var_stream_map", "v:0,a:0,name:360p v:1,a:1,name:720p v:2,a:2,name:1080p",

  "-f", "hls",
  "-hls_time", $segmentDuration,
  "-hls_playlist_type", "vod",
  "-hls_flags", "independent_segments",
  "-hls_segment_filename", (Join-Path $Output "%v/seg_%03d.ts"),
  (Join-Path $Output "%v/index.m3u8")
)

Write-Host "==> Encode HLS: $Input"
& ffmpeg @ffmpegArgs

if ($LASTEXITCODE -ne 0) {
  throw "Encode HLS thất bại với mã lỗi $LASTEXITCODE"
}

$thumbnailPath = Join-Path $Output "thumbnail.jpg"
& ffmpeg -y -ss 00:00:01 -i $Input -frames:v 1 $thumbnailPath | Out-Null

$durationRaw = & ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $Input
$durationSeconds = [Math]::Max([int][Math]::Ceiling([double]$durationRaw), 5)
$durationSpan = [TimeSpan]::FromSeconds($durationSeconds)
$durationLabel = "{0:00}:{1:00}:{2:00}.000" -f $durationSpan.Hours, $durationSpan.Minutes, $durationSpan.Seconds

$thumbnailVtt = @"
WEBVTT

00:00:00.000 --> $durationLabel
thumbnail.jpg
"@

Set-Content -Path (Join-Path $Output "thumbnails.vtt") -Value $thumbnailVtt -Encoding UTF8

Write-Host "✔ HLS xong: $Output"
