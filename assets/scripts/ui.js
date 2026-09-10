// =============================================================================
// ui.js — helper UI yang dipakai berulang di banyak halaman
// =============================================================================

export function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka || 0);
}

export function formatWaktuRelatif(timestamp) {
  if (!timestamp) return "-";
  const tanggal = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(tanggal);
}

export function formatDurasiKirim(menit) {
  if (menit < 60) return `${menit} menit`;
  const jam = Math.floor(menit / 60);
  const sisaMenit = menit % 60;
  return sisaMenit > 0 ? `${jam} jam ${sisaMenit} menit` : `${jam} jam`;
}

let toastTimer = null;
export function tampilkanToast(pesan, tipe = "info") {
  document.querySelectorAll(".toast").forEach((el) => el.remove());
  const toast = document.createElement("div");
  toast.className = `toast ${tipe === "error" ? "toast--error" : tipe === "success" ? "toast--success" : ""}`;
  toast.textContent = pesan;
  document.body.appendChild(toast);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.remove(), 4200);
}

export function bukaModal(id) {
  document.getElementById(id)?.removeAttribute("hidden");
}
export function tutupModal(id) {
  document.getElementById(id)?.setAttribute("hidden", "");
}

/**
 * Kompres gambar di sisi browser sebelum diunggah/di-encode, supaya tidak
 * kena limit 1 MiB per dokumen Firestore dan supaya upload ke Storage lebih
 * cepat. Mengembalikan Blob JPEG hasil kompresi.
 */
export function kompresGambar(file, { maxDimensi = 1000, kualitas = 0.75 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDimensi) {
          height = Math.round((height * maxDimensi) / width);
          width = maxDimensi;
        } else if (height > maxDimensi) {
          width = Math.round((width * maxDimensi) / height);
          height = maxDimensi;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Gagal kompres gambar"))), "image/jpeg", kualitas);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function validasiTidakKosong(nilai) {
  return typeof nilai === "string" ? nilai.trim().length > 0 : nilai !== null && nilai !== undefined;
}

export function validasiNomorHP(nilai) {
  return /^(\+62|62|0)8[0-9]{8,12}$/.test(nilai.trim());
}

export function validasiUrlGoogleDrive(nilai) {
  return /^https:\/\/(drive|docs)\.google\.com\//.test(nilai.trim());
}
