import { applyThemePreference, CONFIG, getSavedTheme } from "./config.js";
import { qs } from "./dom.js";
import { getCurrentPage } from "./router.js";
import { renderHeader } from "../components/header.js";
import { renderFooter } from "../components/footer.js";

export const initApp = () => {
  applyThemePreference(getSavedTheme());

  const headerRoot = qs("[data-app-header]");
  const footerRoot = qs("[data-app-footer]");

  if (headerRoot) {
    renderHeader(headerRoot, getCurrentPage());
  }

  if (footerRoot) {
    renderFooter(footerRoot);
  }

  document.documentElement.lang = "vi";
  document.body.dataset.page = getCurrentPage();
  document.title = document.title || CONFIG.siteName;
};

if (!globalThis.__ANIME_STREAM_BOOTSTRAPPED__) {
  globalThis.__ANIME_STREAM_BOOTSTRAPPED__ = true;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp, { once: true });
  } else {
    initApp();
  }
}
