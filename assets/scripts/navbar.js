// =============================================================================
// navbar.js — navbar yang sama dipakai di semua halaman, beda status login.
// =============================================================================

import { pantauStatusLogin, logout } from "./auth.js";
import { ADMIN_AUTH_URL } from "./firebase-config.js";

export function pasangNavbar() {
  const root = document.getElementById("navbar-root");
  if (!root) return;

  root.innerHTML = `
    <header class="navbar">
      <div class="navbar__inner">
        <a href="/index.html" class="navbar__brand">Nugroho<span>Store</span></a>
        <nav class="navbar__links" id="navbar-links">
          <a href="/index.html#produk">Jelajah Produk</a>
          <a href="${ADMIN_AUTH_URL}/login.html">Masuk</a>
        </nav>
      </div>
    </header>
  `;

  pantauStatusLogin((user, profil) => {
    const links = document.getElementById("navbar-links");
    if (!links) return;

    if (!user) {
      links.innerHTML = `
        <a href="/index.html#produk">Jelajah Produk</a>
        <a href="${ADMIN_AUTH_URL}/login.html">Masuk</a>
      `;
      return;
    }

    const isSeller = profil?.isSeller;
    links.innerHTML = `
      <a href="/index.html#produk">Jelajah Produk</a>
      ${isSeller
        ? `<a href="/pages/dashboard-seller.html">Dashboard Toko</a>`
        : `<a href="/pages/become-seller.html">Mulai Berjualan</a>`}
      <a href="/pages/dashboard-buyer.html">Pesanan Saya</a>
      <a href="#" id="navbar-logout">Keluar</a>
    `;
    document.getElementById("navbar-logout")?.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  });
}
