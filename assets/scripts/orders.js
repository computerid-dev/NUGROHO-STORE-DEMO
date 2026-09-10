// =============================================================================
// orders.js — alur transaksi QRIS manual
//
// Status order:
//   menunggu_bayar     -> dibuat saat pembeli klik "Beli", QRIS ditampilkan.
//                         Penjual BELUM dapat notifikasi di tahap ini.
//   menunggu_konfirmasi -> pembeli klik "Saya sudah bayar". Baru di sinilah
//                         penjual mendapat notifikasi (badge/dashboard).
//   lunas              -> penjual mengecek dana masuk lalu konfirmasi manual.
//                         Link Google Drive disalin ke order.driveLink.
//   kedaluwarsa        -> pembeli tidak konfirmasi bayar dalam waktu wajar.
// =============================================================================

import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { hargaAktif } from "./products.js";

const BATAS_MENIT_MENUNGGU_BAYAR = 30; // sesi QRIS otomatis basi kalau tak dikonfirmasi

/** Dipanggil saat pembeli klik "Beli" — membuat order & menampilkan QRIS. */
export async function buatOrder(buyerId, buyerName, produk, seller) {
  const { hargaBayar } = hargaAktif(produk);
  const orderRef = await addDoc(collection(db, "orders"), {
    buyerId,
    buyerName,
    productId: produk.id,
    productName: produk.name,
    productImage: produk.imageUrl,
    sellerId: produk.sellerId,
    sellerName: seller?.name || "Penjual",
    qrisImageUrl: seller?.qrisImageUrl || null,
    price: hargaBayar,
    deliveryMinutes: produk.deliveryMinutes,
    status: "menunggu_bayar",
    driveLink: null,
    createdAt: serverTimestamp(),
    buyerConfirmedAt: null,
    sellerConfirmedAt: null,
    deliveryDeadline: null,
  });
  return orderRef.id;
}

/** Dipanggil saat pembeli klik "Saya sudah bayar". Ini titik notifikasi ke penjual. */
export async function tandaiSudahBayar(orderId) {
  const orderRef = doc(db, "orders", orderId);
  const snap = await getDoc(orderRef);
  if (!snap.exists()) throw new Error("Order tidak ditemukan");
  const order = snap.data();

  const sekarang = new Date();
  const deadline = new Date(sekarang.getTime() + order.deliveryMinutes * 60000);

  await updateDoc(orderRef, {
    status: "menunggu_konfirmasi",
    buyerConfirmedAt: serverTimestamp(),
    deliveryDeadline: Timestamp.fromDate(deadline),
  });
}

/**
 * Dipanggil seller setelah dia cek aplikasi pembayarannya dan yakin dana masuk.
 * Butuh driveLink (diambil dari products_private oleh caller yang memang
 * berhak baca koleksi itu — lihat pages/dashboard-seller).
 */
export async function konfirmasiLunas(orderId, driveLink) {
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, {
    status: "lunas",
    sellerConfirmedAt: serverTimestamp(),
    driveLink,
  });
}

export async function ambilOrder(orderId) {
  const snap = await getDoc(doc(db, "orders", orderId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function ambilOrderPembeli(buyerId) {
  const q = query(
    collection(db, "orders"),
    where("buyerId", "==", buyerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function ambilOrderMenungguPenjual(sellerId) {
  const q = query(
    collection(db, "orders"),
    where("sellerId", "==", sellerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** True kalau penjual sudah melewati batas waktu kirim yang ia janjikan sendiri. */
export function apakahTelatKirim(order) {
  if (order.status !== "menunggu_konfirmasi" || !order.deliveryDeadline) return false;
  const deadline = order.deliveryDeadline.toDate ? order.deliveryDeadline.toDate() : new Date(order.deliveryDeadline);
  return new Date() > deadline;
}

/** True kalau sesi QRIS (menunggu_bayar) sudah basi karena pembeli tak kunjung konfirmasi. */
export function apakahSesiKedaluwarsa(order) {
  if (order.status !== "menunggu_bayar" || !order.createdAt) return false;
  const dibuat = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
  const batas = new Date(dibuat.getTime() + BATAS_MENIT_MENUNGGU_BAYAR * 60000);
  return new Date() > batas;
}
