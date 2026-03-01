# HargaKu — Product Requirements Document

> **Versi:** 1.0 | **Tanggal:** Februari 2026 | **Status:** Draft for Review

---

## 1. Executive Summary

HargaKu adalah web application yang dirancang khusus untuk membantu pelaku UMKM, pengusaha kuliner, dan pemilik usaha kecil dalam menghitung **Harga Pokok Produksi (HPP)** dan **harga jual produk** secara akurat dan efisien.

Banyak pengusaha — terutama di sektor kuliner dan produk olahan — masih mengandalkan perhitungan manual atau perkiraan kasar saat menentukan harga jual. Akibatnya, mereka sering menjual produk di bawah HPP-nya, atau sebaliknya menetapkan harga terlalu tinggi sehingga kalah bersaing.

HargaKu menyelesaikan masalah ini dengan **pendekatan berbasis resep**: pengguna cukup memasukkan daftar bahan baku beserta harga per satuan beli, lalu sistem secara otomatis menghitung biaya per porsi/produk berdasarkan kuantitas yang digunakan dalam resep. Ditambah komponen biaya operasional dan margin keuntungan, aplikasi menghasilkan rekomendasi harga jual yang tepat.

---

## 2. Problem Statement

### 2.1 Latar Belakang

Berdasarkan observasi perilaku pengusaha UMKM di Indonesia, ditemukan beberapa permasalahan utama:

- Harga bahan baku dibeli per satuan besar (kg, liter, lusin), sedangkan penggunaan dalam resep hanya sebagian kecil (gram, ml). Konversi ini kerap diabaikan sehingga perhitungan biaya tidak akurat.
- Pengusaha tidak memperhitungkan biaya tidak langsung seperti gas, listrik, kemasan, dan tenaga kerja ke dalam HPP.
- Tidak ada tools yang sederhana, terjangkau, dan berbahasa Indonesia yang bisa digunakan tanpa keahlian akuntansi.
- Perhitungan dilakukan di kertas atau Excel tanpa standarisasi, mudah hilang, dan sulit diperbarui ketika harga bahan naik.

### 2.2 Contoh Kasus Nyata

Seorang penjual kue membeli tepung terigu 1 kg seharga Rp15.000. Dalam satu resep, ia menggunakan 35 gram tepung. Tanpa kalkulator, ia hanya memperkirakan "biaya tepung sedikit" dan melewatkannya. Padahal:

```
35 gr ÷ 1.000 gr × Rp15.000 = Rp525 per resep
```

Ketika dikalikan dengan 20+ bahan lainnya, akumulasi "perkiraan" ini bisa membuat HPP meleset hingga **30–50%**.

---

## 3. Goals & Success Metrics

### 3.1 Business Goals

- Membantu UMKM Indonesia menghitung HPP secara akurat untuk meningkatkan profitabilitas usaha.
- Menjadi tools referensi utama bagi pengusaha kuliner dan produk olahan dalam penetapan harga.
- Membangun basis pengguna awal (early adopters) sebagai fondasi produk SaaS yang dapat dikembangkan lebih lanjut.

### 3.2 Success Metrics (3 Bulan Post-Launch)

| Metrik | Target | Cara Ukur |
|---|---|---|
| Jumlah pengguna terdaftar | 500 users | Database signup |
| Resep aktif tersimpan | 2.000+ resep | Analytics |
| Retention rate (D30) | > 40% | Cohort analysis |
| Task completion rate (hitung HPP) | > 80% | Funnel tracking |
| NPS Score | > 50 | In-app survey |

---

## 4. Target Users & Personas

### Persona 1: Sari, Pengusaha Kue Rumahan

**Usia:** 32 tahun | **Lokasi:** Surabaya | **Perangkat:** HP Android

Menjual kue kering dan brownies via WhatsApp & Instagram. Membuat 5–10 jenis produk, masing-masing dengan resep berbeda. Selama ini menghitung harga "dari feeling" karena Excel terasa rumit.

**Pain Points:**
- Sering bingung saat harga bahan naik — harus naikkan harga jual berapa?
- Tidak tahu apakah usahanya benar-benar untung atau hanya "balik modal".

---

### Persona 2: Reza, Pemilik Warung Makan Kecil

**Usia:** 40 tahun | **Lokasi:** Bandung | **Perangkat:** Laptop/Tablet

Punya 15–20 menu. Ingin tahu menu mana yang paling menguntungkan. Pernah coba Excel tapi menyerah karena terlalu kompleks.

**Pain Points:**
- Tidak ada visibilitas margin per menu — semua terasa "cukup untung".
- Ketika ada bahan yang harganya naik, tidak tahu harus adjust harga menu yang mana.

---

## 5. User Journey

### 5.1 Core Journey: Hitung HPP Produk Baru

| Step | Aksi User | Sistem Response |
|---|---|---|
| 1 | Buka app, klik "Buat Resep Baru" | Tampilkan form resep kosong |
| 2 | Input nama produk & jumlah porsi/batch | Simpan info dasar resep |
| 3 | Tambah bahan: pilih/input nama bahan | Cari dari database bahan tersimpan atau buat baru |
| 4 | Input harga beli (misal: Rp15.000/kg) | Simpan ke database bahan pengguna |
| 5 | Input kuantitas dalam resep (misal: 35 gr) | Auto-hitung biaya bahan = 35/1000 × 15.000 = Rp525 |
| 6 | Ulangi untuk semua bahan | Update subtotal biaya bahan secara real-time |
| 7 | Tambah biaya operasional (opsional) | Tampilkan preset: gas, listrik, kemasan, tenaga kerja |
| 8 | Input target margin keuntungan (%) | Hitung dan tampilkan rekomendasi harga jual |
| 9 | Review breakdown HPP & harga jual | Tampilkan ringkasan lengkap, opsi export/share |

---

## 6. Features & Requirements

### 6.1 Feature List by Priority

| Fitur | Prioritas | Deskripsi |
|---|---|---|
| Manajemen Bahan Baku | P0 — Must Have | CRUD database bahan: nama, satuan beli, harga beli |
| Konversi Satuan Otomatis | P0 — Must Have | Auto-konversi antar satuan (kg↔gr, L↔ml, lusin↔pcs) |
| Kalkulator HPP per Resep | P0 — Must Have | Hitung biaya bahan per porsi/batch dari resep |
| Biaya Operasional | P0 — Must Have | Tambah biaya tidak langsung (overhead) per produk |
| Rekomendasi Harga Jual | P0 — Must Have | Hitung harga jual berdasarkan HPP + margin target |
| Dashboard Ringkasan | P1 — Should Have | Overview semua produk: HPP, harga jual, margin |
| Update Harga Bahan | P1 — Should Have | Update harga bahan → semua resep terkait ikut update |
| Export PDF / Share | P1 — Should Have | Export hasil perhitungan sebagai PDF atau image |
| Simulasi Harga | P2 — Nice to Have | "What-if": simulasi jika harga bahan naik X% |
| Multi-bahasa (EN/ID) | P2 — Nice to Have | Dukungan bahasa Inggris untuk pasar lebih luas |

### 6.2 Detail Fitur: Kalkulator HPP

**Formula Utama:**

```
HPP = (Σ Biaya Bahan per Porsi) + Biaya Overhead per Porsi
Harga Jual = HPP × (1 + Margin%) + Pajak/Biaya Lainnya
```

**Perhitungan Biaya Bahan per Item:**
- Input: Nama bahan, harga beli (Rp), satuan beli (kg/L/pcs/dll), kuantitas dalam resep, satuan resep
- Output: Biaya bahan = (kuantitas resep ÷ konversi ke satuan beli) × harga beli
- Contoh: 35 gr tepung dari 1 kg @Rp15.000 → `35/1000 × 15.000 = Rp525`

**Biaya Overhead (Operasional):**
- Preset kategori: Gas/bahan bakar, Listrik, Air, Kemasan, Label, Tenaga kerja
- Input: Biaya total per periode + estimasi jumlah produksi → alokasi per produk
- Atau: Input biaya langsung per batch (misal: kemasan Rp500/pcs)

---

## 7. Screen Specifications

| Screen | Elemen Utama | Aksi |
|---|---|---|
| Dashboard | Daftar produk, summary margin, shortcut buat baru | Tap produk → detail, Tap + → buat resep |
| Buat/Edit Resep | Form nama, porsi, list bahan, biaya overhead, margin | Tambah bahan, set margin, lihat HPP real-time |
| Database Bahan | Daftar bahan, harga, satuan, tombol edit | CRUD bahan, update harga |
| Hasil HPP | Breakdown biaya, HPP total, harga jual, margin | Export PDF, share, duplikat resep |
| Pengaturan | Profil usaha, mata uang, template overhead | Update preferensi |

---

## 8. Non-Functional Requirements

### 8.1 Performance
- Halaman load pertama < 3 detik pada koneksi 4G
- Kalkulasi HPP real-time (< 100ms setelah input)
- Dapat bekerja offline untuk fitur core (PWA)

### 8.2 Usability
- Mobile-first design — 80% pengguna target menggunakan HP
- Dapat digunakan tanpa pelatihan/onboarding khusus
- Bahasa antarmuka: Bahasa Indonesia
- Font dan ukuran teks readable tanpa zoom

### 8.3 Security & Privacy
- Autentikasi email + password atau Google OAuth
- Data resep dan bahan hanya dapat diakses oleh pemilik akun
- HTTPS wajib, data tersimpan terenkripsi di server

---

## 9. Rekomendasi Tech Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| Frontend | Next.js (React) + TypeScript | SSR untuk SEO, komponen reusable, type-safe |
| Styling | Tailwind CSS | Cepat, konsisten, mobile-first friendly |
| Backend | Next.js API Routes / Node.js | Satu codebase, mudah deploy |
| Database | PostgreSQL (via Supabase) | Relational cocok untuk struktur resep-bahan, free tier tersedia |
| Auth | Supabase Auth | Built-in Google OAuth, mudah integrasi |
| Hosting | Vercel | Deploy otomatis dari GitHub, free tier cukup untuk MVP |
| Export PDF | React-PDF / Puppeteer | Generate PDF hasil perhitungan HPP |

---

## 10. Scope, Asumsi & Batasan

### 10.1 In Scope (MVP v1.0)
- Web app (desktop & mobile browser), belum termasuk native app
- Single user / single usaha per akun
- Kategori produk: makanan & minuman (kuliner)
- Mata uang: Rupiah Indonesia (IDR)
- Export: PDF dan gambar (PNG)

### 10.2 Out of Scope (Future Releases)
- Integrasi POS (Point of Sale) system
- Laporan akuntansi & laporan laba rugi
- Multi-cabang atau multi-pengguna dalam satu akun
- Marketplace / jual-beli resep antar pengguna
- Aplikasi mobile native (iOS/Android)

### 10.3 Asumsi
- Pengguna memahami resep produknya sendiri (nama bahan, kuantitas)
- Pengguna memiliki akses internet untuk penggunaan pertama kali
- Harga bahan baku diupdate secara manual oleh pengguna

---

## 11. Estimasi Timeline

| Fase | Durasi | Timeline | Deliverable |
|---|---|---|---|
| Discovery | 1 minggu | Minggu 1 | Wireframe, user flow, desain UI (Figma) |
| MVP Dev | 3–4 minggu | Minggu 2–5 | Fitur P0 live: kalkulator HPP, database bahan |
| Beta Test | 1–2 minggu | Minggu 6–7 | Testing dengan 10–20 pengguna pilot, bug fix |
| Launch v1.0 | 1 minggu | Minggu 8 | Public launch, monitoring, feedback collection |
| v1.1 Iteration | 2 minggu | Minggu 9–10 | Fitur P1: dashboard, update harga, export PDF |

---

## 12. Open Questions

1. Apakah MVP akan gratis sepenuhnya, atau ada batasan jumlah resep untuk free tier?
2. Apakah database bahan baku default (harga referensi) perlu disediakan sebagai starting point?
3. Apakah perlu fitur "kolaborasi" (misal: pemilik usaha bisa share akses ke karyawan)?
4. Apakah export akan berupa branded template atau format standar?
5. Apakah perlu integrasi dengan marketplace (Tokopedia, Shopee) untuk referensi harga bahan baku?

---

*HargaKu PRD v1.0 — Februari 2026 — Confidential. Untuk tim Antigravity dan stakeholder terkait.*
