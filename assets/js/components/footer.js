import { CONFIG } from "../core/config.js";

export const renderFooter = (root) => {
  const year = new Date().getFullYear();
  root.className = "site-footer";
  root.innerHTML = `
    <div class="site-footer__inner container">
      <div>
        <strong>${CONFIG.siteName}</strong>
        <p>${CONFIG.siteTagline}</p>
      </div>

      <div class="site-footer__links">
        <a href="${CONFIG.routes.home}">Trang chủ</a>
        <a href="${CONFIG.routes.search}">Tìm kiếm</a>
        <a href="https://developers.cloudflare.com/" target="_blank" rel="noreferrer">Cloudflare Docs</a>
      </div>

      <div class="site-footer__meta">
        <span>© ${year} ${CONFIG.siteName}</span>
        <small>Chỉ dùng cho nội dung bạn sở hữu hoặc đã được cấp phép.</small>
      </div>
    </div>
  `;
};
