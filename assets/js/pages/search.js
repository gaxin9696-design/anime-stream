import "../core/app.js";

import { fetchCatalog, fetchGenres } from "../core/fetcher.js";
import { renderAnimeGrid } from "../components/card.js";
import { qs, setStatus } from "../core/dom.js";
import { debounce, matchAnime, sortCatalog } from "../core/utils.js";
import { getParam, replaceQuery } from "../core/router.js";

const state = {
  catalog: [],
  genres: []
};

const renderGenreOptions = (select, genres) => {
  select.innerHTML = `
    <option value="">Tất cả thể loại</option>
    ${genres
      .map(
        (genre) => `<option value="${genre.slug || genre.name}">${genre.name} (${genre.count ?? 0})</option>`
      )
      .join("")}
  `;
};

const runSearch = () => {
  const query = qs("#search-query").value.trim();
  const genre = qs("#genre-filter").value.trim();
  const sort = qs("#sort-filter").value.trim() || "trending";

  const filtered = sortCatalog(
    state.catalog.filter((anime) => matchAnime(anime, query, genre)),
    sort
  );

  renderAnimeGrid(qs("#search-results"), filtered);
  setStatus(qs("#search-status"), "ready", `Tìm thấy ${filtered.length} kết quả.`);
  replaceQuery({
    q: query || undefined,
    genre: genre || undefined,
    sort: sort === "trending" ? undefined : sort
  });
};

const initSearch = async () => {
  try {
    setStatus(qs("#search-status"), "loading", "Đang tải danh sách anime...");

    const [catalog, genres] = await Promise.all([fetchCatalog(), fetchGenres()]);
    state.catalog = catalog;
    state.genres = genres;

    renderGenreOptions(qs("#genre-filter"), genres);

    qs("#search-query").value = getParam("q", "");
    qs("#genre-filter").value = getParam("genre", "");
    qs("#sort-filter").value = getParam("sort", "trending");

    runSearch();
  } catch (error) {
    console.error(error);
    setStatus(qs("#search-status"), "error", `Không tải được tìm kiếm: ${error.message}`);
  }
};

const debouncedSearch = debounce(runSearch, 180);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initSearch();
    qs("#search-query")?.addEventListener("input", debouncedSearch);
    qs("#genre-filter")?.addEventListener("change", runSearch);
    qs("#sort-filter")?.addEventListener("change", runSearch);
  }, { once: true });
} else {
  initSearch();
  qs("#search-query")?.addEventListener("input", debouncedSearch);
  qs("#genre-filter")?.addEventListener("change", runSearch);
  qs("#sort-filter")?.addEventListener("change", runSearch);
}
