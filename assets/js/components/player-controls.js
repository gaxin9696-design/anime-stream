import { formatTime } from "../core/utils.js";

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 1.75, 2];

const createMenuButtons = (container, options, currentValue, onSelect) => {
  container.replaceChildren();

  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `player-menu__item ${String(option.value) === String(currentValue) ? "is-active" : ""}`.trim();
    button.textContent = option.label;
    button.dataset.value = option.value;
    button.addEventListener("click", () => onSelect(option.value));
    container.append(button);
  });
};

export const createPlayerControls = (shell, options = {}) => {
  const video = options.video;
  const onQualityChange = options.onQualityChange || (() => {});
  const onSubtitleChange = options.onSubtitleChange || (() => {});
  const onSpeedChange = options.onSpeedChange || (() => {});
  const onNext = options.onNext || null;

  const ui = document.createElement("div");
  ui.className = "player-ui";
  ui.innerHTML = `
    <div class="player-ui__layer player-ui__top">
      <div class="player-ui__title-group">
        <span class="player-chip">Anime Stream</span>
        <strong class="player-ui__title">${options.title || "Anime Player"}</strong>
      </div>
      <div class="player-ui__top-actions">
        <button type="button" class="player-button" data-action="pip" aria-label="Picture in picture">PiP</button>
      </div>
    </div>

    <div class="player-ui__layer player-ui__center">
      <button type="button" class="player-button" data-action="rewind" aria-label="Lùi 10 giây">-10</button>
      <button type="button" class="player-button is-primary" data-action="toggle-play" aria-label="Phát/Tạm dừng">▶</button>
      <button type="button" class="player-button" data-action="forward" aria-label="Tới 10 giây">+10</button>
    </div>

    <div class="player-ui__layer player-ui__bottom">
      <div class="player-progress-wrap">
        <input class="player-progress" data-role="progress" type="range" min="0" max="100" step="0.1" value="0" />
        <div class="player-time">
          <span data-role="current-time">00:00</span>
          <span>/</span>
          <span data-role="duration">00:00</span>
        </div>
      </div>

      <div class="player-actions">
        <div class="player-actions__group">
          <button type="button" class="player-button" data-action="toggle-play">▶</button>
          <button type="button" class="player-button" data-action="toggle-mute">🔊</button>
          <input class="player-volume" data-role="volume" type="range" min="0" max="1" step="0.01" value="1" />
          <button type="button" class="player-button" data-action="speed-menu">1x</button>
        </div>

        <div class="player-actions__group is-right">
          <button type="button" class="player-button" data-action="subtitle-menu">CC</button>
          <button type="button" class="player-button" data-action="quality-menu">Auto</button>
          <button type="button" class="player-button ${onNext ? "" : "is-hidden"}" data-action="next">Tập kế</button>
          <button type="button" class="player-button" data-action="fullscreen">⛶</button>
        </div>
      </div>
    </div>

    <div class="player-menu" data-menu="speed" hidden></div>
    <div class="player-menu" data-menu="subtitle" hidden></div>
    <div class="player-menu" data-menu="quality" hidden></div>
    <div class="player-toast" data-role="toast" hidden></div>
    <div class="player-loading" data-role="loading" hidden>Đang tải stream...</div>
  `;

  shell.append(ui);

  const refs = {
    playButtons: Array.from(ui.querySelectorAll('[data-action="toggle-play"]')),
    muteButton: ui.querySelector('[data-action="toggle-mute"]'),
    progress: ui.querySelector('[data-role="progress"]'),
    volume: ui.querySelector('[data-role="volume"]'),
    currentTime: ui.querySelector('[data-role="current-time"]'),
    duration: ui.querySelector('[data-role="duration"]'),
    speedButton: ui.querySelector('[data-action="speed-menu"]'),
    subtitleButton: ui.querySelector('[data-action="subtitle-menu"]'),
    qualityButton: ui.querySelector('[data-action="quality-menu"]'),
    fullscreenButton: ui.querySelector('[data-action="fullscreen"]'),
    pipButton: ui.querySelector('[data-action="pip"]'),
    nextButton: ui.querySelector('[data-action="next"]'),
    rewindButton: ui.querySelector('[data-action="rewind"]'),
    forwardButton: ui.querySelector('[data-action="forward"]'),
    toast: ui.querySelector('[data-role="toast"]'),
    loading: ui.querySelector('[data-role="loading"]'),
    menus: {
      speed: ui.querySelector('[data-menu="speed"]'),
      subtitle: ui.querySelector('[data-menu="subtitle"]'),
      quality: ui.querySelector('[data-menu="quality"]')
    }
  };

  const state = {
    currentQuality: -1,
    currentSubtitle: "off",
    qualityOptions: [{ value: -1, label: "Auto" }],
    subtitleOptions: [{ value: "off", label: "Tắt phụ đề" }],
    toastTimer: null,
    hideTimer: null
  };

  const closeMenus = () => {
    Object.values(refs.menus).forEach((menu) => {
      menu.hidden = true;
    });
  };

  const showMenu = (menuName) => {
    Object.entries(refs.menus).forEach(([name, menu]) => {
      menu.hidden = name !== menuName ? true : !menu.hidden;
    });
  };

  const resetIdleTimer = () => {
    shell.classList.remove("is-idle");
    clearTimeout(state.hideTimer);

    if (!video.paused) {
      state.hideTimer = setTimeout(() => {
        shell.classList.add("is-idle");
      }, 2400);
    }
  };

  const sync = () => {
    refs.playButtons.forEach((button) => {
      button.textContent = video.paused ? "▶" : "❚❚";
      button.setAttribute("aria-label", video.paused ? "Phát" : "Tạm dừng");
    });

    refs.muteButton.textContent = video.muted || video.volume === 0 ? "🔇" : "🔊";
    refs.volume.value = String(video.muted ? 0 : video.volume ?? 1);
    refs.currentTime.textContent = formatTime(video.currentTime);
    refs.duration.textContent = formatTime(video.duration || 0);
    refs.progress.max = String(video.duration || 100);
    refs.progress.value = String(video.currentTime || 0);
    refs.speedButton.textContent = `${video.playbackRate}x`;
    refs.fullscreenButton.textContent = document.fullscreenElement ? "🡽" : "⛶";

    const qualityLabel =
      state.qualityOptions.find((option) => String(option.value) === String(state.currentQuality))?.label ||
      "Auto";
    refs.qualityButton.textContent = qualityLabel;

    const subtitleLabel =
      state.subtitleOptions.find((option) => String(option.value) === String(state.currentSubtitle))?.label ||
      "CC";
    refs.subtitleButton.textContent = subtitleLabel === "Tắt phụ đề" ? "CC" : subtitleLabel;
  };

  const togglePlay = async () => {
    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (error) {
      showToast(`Không thể phát video: ${error.message}`);
    }
  };

  const showToast = (message) => {
    refs.toast.textContent = message;
    refs.toast.hidden = false;
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
      refs.toast.hidden = true;
    }, 1800);
  };

  const setLoading = (flag) => {
    refs.loading.hidden = !flag;
  };

  const setQualityOptions = (options = []) => {
    state.qualityOptions = options.length ? options : [{ value: -1, label: "Auto" }];
    createMenuButtons(refs.menus.quality, state.qualityOptions, state.currentQuality, (value) => {
      state.currentQuality = value;
      onQualityChange(value);
      sync();
      closeMenus();
      showToast(`Chất lượng: ${
        state.qualityOptions.find((option) => String(option.value) === String(value))?.label || value
      }`);
    });
    sync();
  };

  const setSubtitleOptions = (options = []) => {
    state.subtitleOptions = options.length ? options : [{ value: "off", label: "Tắt phụ đề" }];
    createMenuButtons(refs.menus.subtitle, state.subtitleOptions, state.currentSubtitle, (value) => {
      state.currentSubtitle = value;
      onSubtitleChange(value);
      sync();
      closeMenus();
      showToast(
        value === "off"
          ? "Đã tắt phụ đề"
          : `Phụ đề: ${
              state.subtitleOptions.find((option) => String(option.value) === String(value))?.label || value
            }`
      );
    });
    sync();
  };

  const setCurrentQuality = (value) => {
    state.currentQuality = value;
    createMenuButtons(refs.menus.quality, state.qualityOptions, state.currentQuality, (nextValue) => {
      state.currentQuality = nextValue;
      onQualityChange(nextValue);
      sync();
      closeMenus();
    });
    sync();
  };

  const setCurrentSubtitle = (value) => {
    state.currentSubtitle = value;
    createMenuButtons(refs.menus.subtitle, state.subtitleOptions, state.currentSubtitle, (nextValue) => {
      state.currentSubtitle = nextValue;
      onSubtitleChange(nextValue);
      sync();
      closeMenus();
    });
    sync();
  };

  createMenuButtons(
    refs.menus.speed,
    SPEED_OPTIONS.map((value) => ({ value, label: `${value}x` })),
    1,
    (value) => {
      video.playbackRate = Number(value);
      onSpeedChange(value);
      sync();
      closeMenus();
      showToast(`Tốc độ: ${value}x`);
    }
  );

  refs.playButtons.forEach((button) => {
    button.addEventListener("click", togglePlay);
  });

  refs.rewindButton.addEventListener("click", () => {
    video.currentTime = Math.max(0, video.currentTime - 10);
    showToast("Lùi 10 giây");
    sync();
  });

  refs.forwardButton.addEventListener("click", () => {
    video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
    showToast("Tới 10 giây");
    sync();
  });

  refs.muteButton.addEventListener("click", () => {
    video.muted = !video.muted;
    sync();
  });

  refs.progress.addEventListener("input", () => {
    video.currentTime = Number(refs.progress.value);
    sync();
  });

  refs.volume.addEventListener("input", () => {
    const nextVolume = Number(refs.volume.value);
    video.volume = nextVolume;
    video.muted = nextVolume === 0;
    sync();
  });

  refs.speedButton.addEventListener("click", () => showMenu("speed"));
  refs.subtitleButton.addEventListener("click", () => showMenu("subtitle"));
  refs.qualityButton.addEventListener("click", () => showMenu("quality"));

  refs.fullscreenButton.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await shell.requestFullscreen();
      }
      sync();
    } catch (error) {
      showToast(`Không bật được toàn màn hình: ${error.message}`);
    }
  });

  refs.pipButton.addEventListener("click", async () => {
    if (!document.pictureInPictureEnabled || !video.requestPictureInPicture) {
      showToast("Trình duyệt không hỗ trợ PiP");
      return;
    }

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      showToast(`Không bật được PiP: ${error.message}`);
    }
  });

  if (onNext) {
    refs.nextButton.addEventListener("click", onNext);
  }

  shell.addEventListener("mousemove", resetIdleTimer);
  shell.addEventListener("mouseleave", () => {
    if (!video.paused) {
      shell.classList.add("is-idle");
    }
  });

  video.addEventListener("click", togglePlay);
  video.addEventListener("dblclick", async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await shell.requestFullscreen();
    }
    sync();
  });

  video.addEventListener("play", () => {
    resetIdleTimer();
    sync();
  });
  video.addEventListener("pause", () => {
    shell.classList.remove("is-idle");
    sync();
  });
  video.addEventListener("timeupdate", sync);
  video.addEventListener("volumechange", sync);
  video.addEventListener("ratechange", sync);
  video.addEventListener("loadedmetadata", sync);
  document.addEventListener("fullscreenchange", sync);

  const handleKeydown = (event) => {
    const tagName = event.target?.tagName?.toLowerCase();
    if (["input", "textarea", "select"].includes(tagName)) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case " ":
      case "k":
        event.preventDefault();
        togglePlay();
        break;
      case "arrowleft":
        event.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 5);
        sync();
        break;
      case "arrowright":
        event.preventDefault();
        video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 5);
        sync();
        break;
      case "f":
        event.preventDefault();
        refs.fullscreenButton.click();
        break;
      case "m":
        event.preventDefault();
        refs.muteButton.click();
        break;
      case "c":
        event.preventDefault();
        if (state.currentSubtitle === "off" && state.subtitleOptions[1]) {
          const firstSubtitle = state.subtitleOptions[1];
          state.currentSubtitle = firstSubtitle.value;
          onSubtitleChange(firstSubtitle.value);
        } else {
          state.currentSubtitle = "off";
          onSubtitleChange("off");
        }
        sync();
        break;
      default:
        break;
    }
  };

  const handleOutsideClick = (event) => {
    if (!ui.contains(event.target)) {
      closeMenus();
    }
  };

  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("click", handleOutsideClick);

  sync();

  return {
    sync,
    showToast,
    setLoading,
    setQualityOptions,
    setSubtitleOptions,
    setCurrentQuality,
    setCurrentSubtitle,
    destroy() {
      clearTimeout(state.toastTimer);
      clearTimeout(state.hideTimer);
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("click", handleOutsideClick);
      document.removeEventListener("fullscreenchange", sync);
      ui.remove();
    }
  };
};
