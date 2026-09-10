// =============================================================================
// auth.js — Nugroho Store
//
// Nugroho Store TIDAK punya form login sendiri. Login/registrasi dilakukan di
// project terpisah "Admin Auth System". Setelah berhasil login di sana, Admin
// Auth System mengarahkan (redirect) pengguna balik ke Nugroho Store dengan
// membawa sebuah "custom token" Firebase lewat query string:
//
//   https://nugroho.store/?authToken=<custom_token_dari_admin_auth_system>
//
// Nugroho Store lalu menukar custom token itu jadi sesi login asli lewat
// signInWithCustomToken(). Ini pola standar untuk berbagi sesi Firebase Auth
// lintas dua domain berbeda tanpa menggabungkan codebase.
// =============================================================================

import { auth, db, ADMIN_AUTH_URL } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

/** Menukar authToken dari URL (dikirim Admin Auth System) jadi sesi login. */
async function tukarTokenDariUrlJikaAda() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("authToken");
  if (!token) return;

  try {
    await signInWithCustomToken(auth, token);
  } catch (err) {
    console.error("Gagal menukar token dari Admin Auth System:", err);
  } finally {
    // Bersihkan token dari address bar supaya tidak ke-share/ke-bookmark
    params.delete("authToken");
    const sisaQuery = params.toString();
    const urlBaru =
      window.location.pathname + (sisaQuery ? `?${sisaQuery}` : "") + window.location.hash;
    window.history.replaceState({}, "", urlBaru);
  }
}

/** Lempar pengguna ke halaman login Admin Auth System, bawa balik URL saat ini. */
export function arahkanKeLogin() {
  const kembaliKe = encodeURIComponent(window.location.href);
  window.location.href = `${ADMIN_AUTH_URL}/login.html?redirect=${kembaliKe}`;
}

export async function logout() {
  await signOut(auth);
  window.location.href = "/index.html";
}

/** Ambil dokumen profil pengguna dari koleksi `users`. */
export async function ambilProfil(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Pastikan pengguna sudah login. Kalau belum, redirect ke Admin Auth System.
 * Dipakai di halaman yang wajib login (create-product, dashboard, checkout).
 * Mengembalikan Promise<{user, profil}>.
 */
export function wajibLogin() {
  return new Promise((resolve) => {
    tukarTokenDariUrlJikaAda().then(() => {
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          arahkanKeLogin();
          return;
        }
        const profil = await ambilProfil(user.uid);
        resolve({ user, profil });
      });
    });
  });
}

/**
 * Versi "lunak": tetap tampilkan halaman meski belum login (misal halaman
 * marketplace publik), tapi tetap kasih tahu status login untuk navbar.
 */
export function pantauStatusLogin(callback) {
  tukarTokenDariUrlJikaAda().then(() => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) return callback(null, null);
      const profil = await ambilProfil(user.uid);
      callback(user, profil);
    });
  });
}
