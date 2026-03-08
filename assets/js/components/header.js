import { CONFIG, applyThemePreference, getSavedTheme, runtimeSummary } from "../core/config.js";
import { go, searchUrl } from "../core/router.js";

const navItems = [
  { key: "home", label: "Trang chủ", href: CONFIG.routes.home },
  { key: "search", label: "Tìm kiếm", href: CONFIG.routes.search },
  { key: "watch", label: "Đang xem", href: CONFIG.routes.watch }
];

export const renderHeader = (root, activePage = "home") => {
  root.className = "site-header";
  root.innerHTML = `
    <div class="site-header__inner container">
      <a class="brand" href="${CONFIG.routes.home}">
        <img src="/assets/images/logo.png" alt="${CONFIG.siteName}" class="brand__logo" />
        <span class="brand__name">${CONFIG.siteName}</span>
      </a>

      <nav class="site-nav" aria-label="Điều hướng chính">
        ${navItems
          .map(
            (item) => `
            <a
              class="site-nav__link ${activePage === item.key ? "is-active" : ""}"
              href="${item.href}"
            >
              ${item.label}
            </a>
          `
          )
          .join("")}
      </nav>

      <div class="site-header__actions">
        <form class="site-search" data-header-search>
          <img src="/assets/images/icons/search.svg" alt="" aria-hidden="true" />
          <input
            type="search"
            name="q"
            placeholder="Tìm anime, thể loại, studio..."
            autocomplete="off"
          />
        </form>

        <button class="theme-toggle" type="button" data-theme-toggle aria-label="Chuyển giao diện">
          ${getSavedTheme() === "light" ? "🌞" : "🌙"}
        </button>
      </div>
    </div>
  `;

  const searchForm = root.querySelector("[data-header-search]");
  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = new FormData(searchForm).get("q")?.toString().trim() || "";
    go(searchUrl(query));
  });

  const searchInput = root.querySelector('input[name="q"]');
  const params = new URLSearchParams(globalThis.location.search);
  searchInput.value = params.get("q") || "";

  const themeButton = root.querySelector("[data-theme-toggle]");
  themeButton?.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    applyThemePreference(nextTheme);
    themeButton.textContent = nextTheme === "light" ? "🌞" : "🌙";
  });

  root.dataset.runtime = JSON.stringify(runtimeSummary());
};
