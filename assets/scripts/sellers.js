// =============================================================================
// sellers.js
// =============================================================================

import { db, storage } from "./firebase-config.js";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";
import { kompresGambar } from "./ui.js";

/** Daftar jadi penjual: bio + gambar QRIS aktif. */
export async function daftarJadiSeller(uid, { sellerBio, qrisFile }) {
  const qrisBlob = await kompresGambar(qrisFile, { maxDimensi: 900, kualitas: 0.85 });
  const qrisRef = ref(storage, `sellers/${uid}/qris-${Date.now()}.jpg`);
  await uploadBytes(qrisRef, qrisBlob, { contentType: "image/jpeg" });
  const qrisImageUrl = await getDownloadURL(qrisRef);

  await setDoc(doc(db, "sellers", uid), {
    sellerBio: sellerBio.trim(),
    qrisImageUrl,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "users", uid), { isSeller: true });

  return qrisImageUrl;
}

export async function ambilProfilSeller(uid) {
  const snap = await getDoc(doc(db, "sellers", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Ganti gambar QRIS (misal QRIS lama expired / ganti rekening). */
export async function perbaruiQris(uid, qrisFile) {
  const qrisBlob = await kompresGambar(qrisFile, { maxDimensi: 900, kualitas: 0.85 });
  const qrisRef = ref(storage, `sellers/${uid}/qris-${Date.now()}.jpg`);
  await uploadBytes(qrisRef, qrisBlob, { contentType: "image/jpeg" });
  const qrisImageUrl = await getDownloadURL(qrisRef);
  await updateDoc(doc(db, "sellers", uid), { qrisImageUrl });
  return qrisImageUrl;
}
