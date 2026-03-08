param(
  [Parameter(Mandatory = $true)]
  [string]$InputDir,

  [Parameter(Mandatory = $true)]
  [string]$AnimeId,

  [int]$Season = 1,
  [int]$StartEpisode = 1,
  [string]$OutputRoot = "./media/anime"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $InputDir)) {
  throw "Không tìm thấy thư mục input: $InputDir"
}

$buildScript = Join-Path $PSScriptRoot "build-hls.ps1"
$seasonCode = "s{0:d2}" -f $Season

$videoFiles = Get-ChildItem -Path $InputDir -File |
  Where-Object { $_.Extension -match '^\.(mp4|mkv|mov|avi|m4v)$' } |
  Sort-Object Name

if (-not $videoFiles.Count) {
  throw "Không tìm thấy video trong $InputDir"
}

$episodeNumber = $StartEpisode
foreach ($file in $videoFiles) {
  $episodeCode = "e{0:d2}" -f $episodeNumber
  $outputPath = Join-Path $OutputRoot "$AnimeId/$seasonCode/$episodeCode"

  Write-Host "==> Encode $($file.Name) -> $outputPath"
  & powershell -ExecutionPolicy Bypass -File $buildScript -Input $file.FullName -Output $outputPath

  if ($LASTEXITCODE -ne 0) {
    throw "Batch encode dừng ở file $($file.FullName)"
  }

  $episodeNumber++
}

Write-Host "✔ Batch encode hoàn tất."
