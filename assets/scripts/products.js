// =============================================================================
// products.js
//
// Catatan desain data penting:
// Link Google Drive produk TIDAK disimpan di dokumen `products` (yang publik
// dan bisa dibaca siapa saja), melainkan di koleksi terpisah `products_private`
// dengan id dokumen yang sama dengan productId. Firestore Rules memastikan
// `products_private/{id}` hanya bisa dibaca oleh seller pemilik produk itu
// sendiri — jadi link Drive tidak pernah bocor ke publik lewat query produk.
// Saat order lunas, seller (yang memang berhak baca products_private miliknya)
// menyalin link itu ke dalam dokumen order, dan rules memastikan hanya field
// `driveLink` + `status` yang boleh diubah, dan hanya oleh seller produk terkait.
// =============================================================================

import { db, storage } from "./firebase-config.js";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";
import { kompresGambar } from "./ui.js";

/** Upload Blob gambar (sudah dikompres) ke Firebase Storage, kembalikan URL publik. */
async function unggahGambar(blob, path) {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  return getDownloadURL(storageRef);
}

/**
 * Publish produk baru.
 * @param {object} data - { name, price, discountPrice, discountDays, description, deliveryMinutes, driveLink, imageFile }
 */
export async function publishProduk(sellerId, data) {
  const gambarKompres = await kompresGambar(data.imageFile, { maxDimensi: 1000, kualitas: 0.78 });
  const namaFile = `products/${sellerId}/${Date.now()}.jpg`;
  const imageUrl = await unggahGambar(gambarKompres, namaFile);

  let discountUntil = null;
  if (data.discountPrice && data.discountDays) {
    const target = new Date();
    target.setDate(target.getDate() + Number(data.discountDays));
    discountUntil = target;
  }

  const produkRef = await addDoc(collection(db, "products"), {
    sellerId,
    name: data.name.trim(),
    imageUrl,
    price: Number(data.price),
    discountPrice: data.discountPrice ? Number(data.discountPrice) : null,
    discountUntil,
    description: data.description.trim(),
    deliveryMinutes: Number(data.deliveryMinutes),
    isPublished: true,
    createdAt: serverTimestamp(),
  });

  // Link Google Drive disimpan terpisah, tidak publik.
  await setDoc(doc(db, "products_private", produkRef.id), {
    sellerId,
    driveLink: data.driveLink.trim(),
  });

  return produkRef.id;
}

export async function ambilSemuaProduk() {
  const q = query(
    collection(db, "products"),
    where("isPublished", "==", true),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function ambilProdukById(productId) {
  const snap = await getDoc(doc(db, "products", productId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function ambilProdukMilikSeller(sellerId) {
  const q = query(
    collection(db, "products"),
    where("sellerId", "==", sellerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Ambil link Google Drive rahasia milik produk. Hanya berhasil kalau yang
 * memanggil adalah seller pemilik produk (ditegakkan oleh Firestore Rules).
 */
export async function ambilDriveLinkPrivate(productId) {
  const snap = await getDoc(doc(db, "products_private", productId));
  return snap.exists() ? snap.data().driveLink : null;
}

/** Hitung harga aktif produk (mempertimbangkan diskon & masa berlakunya). */
export function hargaAktif(produk) {
  const kini = new Date();
  const diskonMasihBerlaku =
    produk.discountPrice &&
    produk.discountUntil &&
    (produk.discountUntil.toDate ? produk.discountUntil.toDate() : new Date(produk.discountUntil)) > kini;

  return {
    hargaAsli: produk.price,
    hargaBayar: diskonMasihBerlaku ? produk.discountPrice : produk.price,
    sedangDiskon: !!diskonMasihBerlaku,
  };
}
