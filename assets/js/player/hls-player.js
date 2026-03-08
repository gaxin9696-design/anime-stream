import { getHls } from "../libs/hls.min.js";

const tryRecover = (Hls, hls, data) => {
  if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
    hls.startLoad();
    return true;
  }

  if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
    hls.recoverMediaError();
    return true;
  }

  return false;
};

export const createHlsPlayer = async (video, sourceUrl, hooks = {}) => {
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = sourceUrl;
    return {
      backend: "native",
      destroy() {},
      getLevels() {
        return [];
      },
      getCurrentLevel() {
        return -1;
      },
      setQuality() {}
    };
  }

  const Hls = await getHls();

  if (!Hls?.isSupported?.()) {
    video.src = sourceUrl;
    return {
      backend: "native-fallback",
      destroy() {},
      getLevels() {
        return [];
      },
      getCurrentLevel() {
        return -1;
      },
      setQuality() {}
    };
  }

  const hls = new Hls({
    enableWorker: true,
    capLevelToPlayerSize: true,
    backBufferLength: 30,
    lowLatencyMode: false
  });

  hls.attachMedia(video);
  hls.on(Hls.Events.MEDIA_ATTACHED, () => {
    hls.loadSource(sourceUrl);
  });

  hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
    hooks.onReady?.(data, hls);
  });

  hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
    hooks.onLevelChanged?.(data, hls);
  });

  hls.on(Hls.Events.ERROR, (_, data) => {
    if (data.fatal) {
      const recovered = tryRecover(Hls, hls, data);
      hooks.onError?.(data, recovered);
      if (!recovered) {
        hls.destroy();
      }
    } else {
      hooks.onWarning?.(data);
    }
  });

  return {
    backend: "hls.js",
    hls,
    destroy() {
      hls.destroy();
    },
    getLevels() {
      return hls.levels ?? [];
    },
    getCurrentLevel() {
      return hls.autoLevelEnabled ? -1 : hls.currentLevel;
    },
    setQuality(levelIndex) {
      if (Number(levelIndex) < 0) {
        hls.currentLevel = -1;
        return;
      }

      hls.currentLevel = Number(levelIndex);
    }
  };
};
