export const buildQualityOptions = (levels = []) => {
  const items = levels
    .map((level, index) => ({
      value: index,
      height: Number(level.height ?? 0),
      bitrate: Number(level.bitrate ?? 0),
      label:
        level.height && level.height > 0
          ? `${level.height}p`
          : `${Math.round((level.bitrate ?? 0) / 1000)} kbps`
    }))
    .sort((a, b) => a.height - b.height || a.bitrate - b.bitrate);

  return [{ value: -1, label: "Auto" }, ...items];
};

export const getQualityLabel = (level) => {
  if (!level) {
    return "Auto";
  }

  if (Number(level.height ?? 0) > 0) {
    return `${level.height}p`;
  }

  return `${Math.round((level.bitrate ?? 0) / 1000)} kbps`;
};
