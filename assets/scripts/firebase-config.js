// =============================================================================
// firebase-config.js
// Konfigurasi Firebase project "store-6d392".
// Catatan: apiKey di sini AMAN ditaruh di frontend — ini cuma identifier
// project, bukan secret. Yang wajib dirahasiakan adalah service account key
// (Admin SDK), dan itu HANYA boleh dipakai di server (lihat admin-auth-system/server).
// =============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getFirestore,
  connectFirestoreEmulator,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import {
  getAuth,
  connectAuthEmulator,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDNs7sx1rcgWorhwWP2YYiH7LFj5S_dZAk",
  authDomain: "store-6d392.firebaseapp.com",
  projectId: "store-6d392",
  storageBucket: "store-6d392.firebasestorage.app",
  messagingSenderId: "975874685807",
  appId: "1:975874685807:web:d1c674a94dfd4061fa469a",
  measurementId: "G-MCSLCTW4FV",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// URL project "Admin Auth System" — ganti sesuai domain deploy kamu.
// Nugroho Store melempar pengguna ke sini kalau belum login.
export const ADMIN_AUTH_URL = "https://auth.nugroho.store";

// Aktifkan baris di bawah ini kalau mau develop lokal pakai Firebase Emulator Suite
// (opsional, tidak wajib untuk jalan ke production):
// connectFirestoreEmulator(db, "localhost", 8080);
// connectAuthEmulator(auth, "http://localhost:9099");
