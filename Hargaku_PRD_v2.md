# HargaKu — PRD: Integrasi POS & Manajemen Stok

> **Versi:** 2.0 | **Tanggal:** Maret 2026 | **Status:** Draft for Review
> **Dilanjutkan dari:** HargaKu v1.0 (Phase 7 Complete)
> **Untuk:** Tim Dev Antigravity (Technical)
> **Revisi:** +WhatsApp/Manual order flow, +Inventory onboarding, +Technical depth

---

## 0. Context & Continuity

HargaKu v1.0 telah menyelesaikan 7 phase dengan fondasi yang solid. PRD ini adalah **sambungan langsung** — semua keputusan teknis di sini mengasumsikan stack dan schema v1.0 sudah ada.

| Sudah Ada (v1.0) | Ditambahkan (v2.0) |
|---|---|
| ✅ Ingredient CRUD (Supabase) | ➕ `stock_quantity`, `min_stock_alert` per ingredient |
| ✅ Recipe + HPP Calculation | ➕ Auto-deduct stok saat transaksi tercatat |
| ✅ Overhead & Margin Slider | ➕ POS: Walk-in, WhatsApp Order, Manual Entry |
| ✅ Export PDF | ➕ Laporan penjualan + profit aktual |
| ✅ Mobile-responsive (Hamburger + Bottom Nav) | ➕ Inventory onboarding flow |
| ✅ Supabase Auth (pending Phase 8) | ➕ Low-stock alert + restock log |

> **Prinsip pengembangan v2.0: Jangan rebuild, sambungkan.**
> Semua fitur baru harus extend schema dan komponen yang sudah ada.
> Tidak ada halaman atau tabel lama yang dihapus.

---

## 1. Executive Summary

**HargaKu v2.0** menutup loop end-to-end UMKM:

```
[HPP Planning] ──► [Inventory Setup] ──► [POS / Sales Entry] ──► [Stock Auto-Deduction] ──► [Profit Analytics]
   (v1.0 ✅)           (v2.0 NEW)              (v2.0 NEW)               (v2.0 NEW)                (v2.0 NEW)
```

Seorang pengusaha mencatat penjualan 3 porsi Nasi Goreng Spesial — baik dari kasir langsung, order WhatsApp, maupun catat manual di malam hari — dan sistem akan:

1. Mencatat transaksi & pendapatan dengan channel yang sesuai
2. Menghitung profit aktual vs HPP yang sudah dihitung di v1.0
3. Otomatis mengurangi stok bahan baku sesuai komposisi resep × qty terjual
4. Memperingatkan jika stok mendekati batas minimum yang telah diset

Ini mengubah HargaKu dari kalkulator HPP menjadi **sistem operasional UMKM yang lengkap**.

---

## 2. Problem Statement

### 2.1 Gap yang Ada Sekarang

Setelah berhasil menghitung HPP di v1.0, pengguna kembali ke cara manual untuk operasional harian:

- Penjualan dicatat di buku tulis atau tidak dicatat sama sekali
- Order dari WhatsApp diproses manual tanpa integrasi ke pencatatan stok
- Stok bahan baku tidak terpantau — pengusaha baru tahu habis ketika mau masak
- Profit adalah "feeling" — tidak ada angka nyata laba per hari/minggu/bulan

### 2.2 Tiga Mode Penjualan UMKM yang Harus Didukung

Berdasarkan riset perilaku pengguna target, ada 3 cara berbeda UMKM mencatat penjualan:

| Mode | Kapan Terjadi | Karakteristik |
|---|---|---|
| **Walk-in / Kasir** | Pembeli datang langsung | Butuh speed < 30 detik, layar aktif terus |
| **WhatsApp Order** | Order diterima via WA, dibayar di muka/COD | Dicatat setelah konfirmasi order, bisa beberapa jam setelah order masuk |
| **Manual Entry** | Rekapitulasi penjualan di akhir hari/shift | Input batch beberapa transaksi sekaligus, akurasi > kecepatan |

Semua mode harus menghasilkan **output yang identik**: transaksi tercatat, stok terdeduksi, laporan terupdate.

### 2.3 Masalah Stok: Belum Ada Baseline

Karena manajemen stok belum pernah dipikirkan sebelumnya, ada masalah chicken-and-egg:

- Tidak ada stok awal → deduction tidak bermakna
- Tapi input stok awal 50+ bahan sekaligus akan membuat pengguna menyerah sebelum mulai

**Solusi yang dipilih:** Inventory onboarding bertahap dengan "lazy stock init" — stok bisa diisi kapan saja, sistem tetap berfungsi meski belum semua bahan punya stok. Lihat detail di Section 6.4.

### 2.4 Jobs to Be Done

| Sebagai... | Saya ingin... | Supaya... |
|---|---|---|
| Kasir warung | Catat transaksi walk-in < 30 detik | Antrian tidak menumpuk |
| Pemilik usaha online | Log order WA dengan detail pembeli | Semua order terdata rapi tanpa buku tulis |
| Pengusaha rajin rekapitulasi | Input penjualan hari ini sebelum tidur | Data tetap akurat meski tidak real-time |
| Pemilik usaha | Tahu stok tepung sisa berapa gr | Tidak kehabisan bahan di tengah hari |
| Pengusaha UMKM | Lihat profit aktual per produk per bulan | Keputusan menu berbasis data bukan perasaan |

---

## 3. Goals & Success Metrics

### 3.1 Business Goals

- Meningkatkan **daily active usage** dengan menjadikan app sebagai tools operasional harian, bukan kalkulasi sekali pakai
- Memberikan **visibilitas profit aktual** yang sebelumnya tidak tersedia bagi UMKM
- Membangun data layer yang menjadi fondasi fitur premium: laporan pajak, multi-outlet, marketplace

### 3.2 Success Metrics (3 Bulan Post-Launch v2.0)

| Metrik | Target | Baseline v1.0 |
|---|---|---|
| DAU / MAU ratio | > 40% | ~10% |
| Transaksi dicatat per user/bulan | > 50 | 0 |
| Users yang setup stock minimal 1 ingredient | > 70% | 0 |
| Inventory alert triggered | > 30% users | 0 |
| Churn rate (monthly) | < 15% | N/A |

---

## 4. Feature Scope v2.0

### 4.1 Overview Modul

```
┌────────────────────────────────────────────────────────────────┐
│                        HARGAKU v2.0                            │
├────────────────┬─────────────────────────┬─────────────────────┤
│  HPP Module    │      POS Module          │  Inventory Module   │
│  (v1.0 ✅)    │      (v2.0 NEW)          │  (v2.0 NEW)         │
│                │                          │                     │
│ • Ingredients  │ • Walk-in Quick Sale     │ • Stock Levels      │
│ • Recipes      │ • WhatsApp Order Entry   │ • Onboarding Flow   │
│ • Overhead     │ • Manual / Batch Entry   │ • Auto-deduction    │
│ • HPP Calc     │ • Cart (multi-item)      │ • Restock log       │
│ • Export PDF   │ • Payment method log     │ • Low-stock alert   │
│                │ • Sales history          │ • Usage report      │
│                │ • Void / cancel          │ • Manual adjustment │
└────────────────┴─────────────────────────┴─────────────────────┘
         ↑                    ↑                       ↑
         └────────────────────┴───────────────────────┘
                   Shared: Supabase PostgreSQL
                   Shared: Recipe & Ingredient data dari v1.0
```

### 4.2 Feature List by Priority

| ID | Fitur | Modul | Prioritas | Est. Dev |
|---|---|---|---|---|
| F01 | Stock Level per Ingredient + Onboarding | Inventory | P0 | 3 hr |
| F02 | Auto-deduct stok saat transaksi | Inventory | P0 | 2 hr |
| F03 | Walk-in Quick Sale (kasir mode) | POS | P0 | 3 hr |
| F04 | Cart — multi-product transaction | POS | P0 | 2 hr |
| F05 | Payment method logging (Cash/Transfer/QRIS) | POS | P0 | 1 hr |
| F06 | WhatsApp Order Entry | POS | P0 | 2 hr |
| F07 | Manual / Batch Entry (post-sale logging) | POS | P0 | 2 hr |
| F08 | Sales history list | POS | P0 | 2 hr |
| F09 | Low-stock alert & badge | Inventory | P1 | 2 hr |
| F10 | Restock log (catat pembelian bahan) | Inventory | P1 | 2 hr |
| F11 | Daily/Weekly sales summary dashboard | Analytics | P1 | 3 hr |
| F12 | Profit actuals per product | Analytics | P1 | 2 hr |
| F13 | Void / cancel transaksi + stock reversal | POS | P1 | 2 hr |
| F14 | Manual stock adjustment + reason log | Inventory | P2 | 1 hr |
| F15 | Export laporan penjualan (PDF) | POS | P2 | 2 hr |
| F16 | Ingredient usage report | Analytics | P2 | 3 hr |

---

## 5. Database Schema

> Rule: extend only. Tidak ada `DROP TABLE` atau `ALTER COLUMN` yang destructive.

### 5.1 Modifikasi Tabel Existing

```sql
-- ============================================================
-- EXTEND: ingredients
-- Semua kolom baru nullable dengan DEFAULT — zero breaking change
-- ============================================================
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS stock_quantity    DECIMAL(10,3),         -- NULL = belum diisi (beda dari 0 = habis)
  ADD COLUMN IF NOT EXISTS stock_unit        VARCHAR(20),           -- harus match atau convertible ke unit beli
  ADD COLUMN IF NOT EXISTS min_stock_alert   DECIMAL(10,3),         -- NULL = alert dinonaktifkan
  ADD COLUMN IF NOT EXISTS last_restocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stock_notes       TEXT;                  -- catatan khusus (misal: "simpan di kulkas")

-- Index untuk query inventory status
CREATE INDEX IF NOT EXISTS idx_ingredients_user_stock
  ON ingredients(user_id, stock_quantity, min_stock_alert);

-- ============================================================
-- TIDAK ADA perubahan pada: recipes, recipe_ingredients
-- Kolom quantity & unit di recipe_ingredients sudah cukup
-- ============================================================
```

### 5.2 Tabel Baru

```sql
-- ============================================================
-- transactions: header transaksi penjualan
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trx_number      VARCHAR(25) UNIQUE,                 -- "TRX-20260301-0001", generated server-side
  sale_channel    VARCHAR(20) NOT NULL DEFAULT 'walkin',
                                                      -- walkin | whatsapp | manual
  status          VARCHAR(20) NOT NULL DEFAULT 'completed',
                                                      -- completed | voided
  payment_method  VARCHAR(20),                        -- cash | transfer | qris | cod | null (belum diisi)
  customer_name   VARCHAR(255),                       -- opsional, relevan untuk WA order
  customer_contact VARCHAR(100),                      -- nomor WA atau lainnya
  subtotal        DECIMAL(12,2) NOT NULL,
  discount        DECIMAL(12,2) NOT NULL DEFAULT 0,
  total           DECIMAL(12,2) NOT NULL,
  notes           TEXT,
  sale_date       DATE         NOT NULL DEFAULT CURRENT_DATE,  -- tanggal jual (bisa diisi manual untuk back-date)
  sale_time       TIME,                               -- waktu jual (opsional untuk manual entry)
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  voided_at       TIMESTAMPTZ,
  voided_by       UUID         REFERENCES auth.users(id),
  voided_reason   TEXT
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON transactions(user_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status
  ON transactions(user_id, status);

-- ============================================================
-- transaction_items: line items per transaksi
-- Semua data di-snapshot saat transaksi — JANGAN JOIN ke recipes untuk histori
-- ============================================================
CREATE TABLE IF NOT EXISTS transaction_items (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID        NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  recipe_id       UUID        REFERENCES recipes(id) ON DELETE SET NULL,  -- nullable: resep boleh dihapus
  recipe_name     VARCHAR(255) NOT NULL,              -- SNAPSHOT — tidak berubah meski resep diedit
  quantity        INTEGER     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price      DECIMAL(12,2) NOT NULL,             -- SNAPSHOT harga jual saat transaksi
  hpp_at_sale     DECIMAL(12,2),                      -- SNAPSHOT HPP saat transaksi
  subtotal        DECIMAL(12,2) NOT NULL               -- unit_price × quantity
);

CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction
  ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_recipe
  ON transaction_items(recipe_id, transaction_id);

-- ============================================================
-- stock_movements: audit trail lengkap semua perubahan stok
-- Append-only — tidak ada UPDATE atau DELETE pada tabel ini
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_id    UUID        REFERENCES ingredients(id) ON DELETE SET NULL,
  ingredient_name  VARCHAR(255) NOT NULL,             -- SNAPSHOT
  movement_type    VARCHAR(20)  NOT NULL,             -- sale | restock | adjustment | void | initial
  quantity_change  DECIMAL(10,3) NOT NULL,            -- negatif = keluar, positif = masuk
  quantity_before  DECIMAL(10,3),                     -- NULL jika initial setup
  quantity_after   DECIMAL(10,3),
  unit             VARCHAR(20),
  reference_id     UUID,                              -- transaction_id atau restock_log_id
  reference_type   VARCHAR(20),                       -- transaction | restock | adjustment
  notes            TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_ingredient
  ON stock_movements(ingredient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference
  ON stock_movements(reference_id);

-- ============================================================
-- restock_logs: log pembelian bahan baku
-- ============================================================
CREATE TABLE IF NOT EXISTS restock_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_id   UUID        NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_added  DECIMAL(10,3) NOT NULL CHECK (quantity_added > 0),
  unit            VARCHAR(20)  NOT NULL,
  purchase_price  DECIMAL(12,2),                      -- harga beli saat restock (update ingredient.price jika beda)
  update_base_price BOOLEAN   DEFAULT false,          -- apakah update harga HPP di tabel ingredients
  supplier_name   VARCHAR(255),
  notes           TEXT,
  purchased_at    DATE         NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### 5.3 Entity Relationship Diagram

```
auth.users (1)
    │
    ├──(n)──► ingredients ──────────────────────────────────────┐
    │              │ stock_quantity (nullable)                   │
    │              │ min_stock_alert (nullable)                  │
    │              │                                             │
    │              ├──(n)──► recipe_ingredients ◄──(n)── recipes │
    │              │              [quantity, unit]    [batch_size]│
    │              │                                             │
    │              ├──(n)──► stock_movements                     │
    │              │              [movement_type, quantity_change]│
    │              │                    ▲                        │
    │              │                    │ (generated on sale/void)│
    │              │                    │                        │
    │              └──(n)──► restock_logs                        │
    │                                                            │
    └──(n)──► transactions                                       │
                  │ [sale_channel, status, sale_date]            │
                  │                                              │
                  └──(n)──► transaction_items ──────────────────►┘
                                [recipe_id (FK, nullable)]
                                [recipe_name SNAPSHOT]
                                [unit_price SNAPSHOT]
                                [hpp_at_sale SNAPSHOT]
```

---

## 6. Business Logic & Rules

### 6.1 Core Rule: Auto Stock Deduction

```
TRIGGER: transactions.status = 'completed' (INSERT atau UPDATE)

FOR EACH item IN transaction_items WHERE transaction_id = NEW.id:
  recipe = recipes WHERE id = item.recipe_id

  IF recipe NOT FOUND:
    SKIP deduction (resep sudah dihapus, tidak bisa hitung)
    LOG warning di stock_movements dengan type = 'skipped'
    CONTINUE

  FOR EACH ri IN recipe_ingredients WHERE recipe_id = recipe.id:
    ingredient = ingredients WHERE id = ri.ingredient_id

    IF ingredient.stock_quantity IS NULL:
      SKIP (stok belum diinit — jangan buat stok jadi negatif dari null)
      CONTINUE

    usage_per_unit_sold = ri.quantity / recipe.batch_size
    total_usage = usage_per_unit_sold × item.quantity
    deduction_in_stock_unit = convert_unit(total_usage, ri.unit, ingredient.stock_unit)

    -- Update stok (biarkan negatif — lihat rule 6.3)
    UPDATE ingredients
      SET stock_quantity = stock_quantity - deduction_in_stock_unit
    WHERE id = ingredient.id

    INSERT INTO stock_movements (movement_type='sale', quantity_change=-deduction, ...)

    IF (stock_quantity - deduction) < ingredient.min_stock_alert:
      APPEND TO response.stock_warnings[]
```

### 6.2 Unit Conversion Rules

Fungsi konversi yang sudah ada di `/utils/unitConversion.ts` (v1.0) dijadikan **single source of truth**. Semua konversi — baik di frontend maupun Supabase RPC — harus menggunakan logika yang sama.

```
Konversi yang didukung:
  Massa : kg ↔ gr ↔ mg  (base: gr)
  Volume: L  ↔ ml ↔ cc  (base: ml, cc = ml)
  Count : lusin ↔ pcs   (base: pcs, 1 lusin = 12 pcs)

Konversi yang TIDAK didukung (error):
  gr ↔ ml  (massa ≠ volume, kecuali ada density factor — out of scope v2.0)
  kg ↔ pcs

Error handling: Jika unit tidak compatible, skip deduction + log warning.
Jangan block transaksi hanya karena unit mismatch.
```

### 6.3 Stok Negatif: Diizinkan, Bukan Error

```
Stok negatif BUKAN bug — ini adalah fitur.

Alasan: UMKM sering tidak input restock secara real-time.
Mereka beli bahan pagi, baru input di aplikasi malam hari.
Transaksi siang hari akan membuat stok sementara negatif.

Behavior:
  stock_quantity < 0         → tampilkan badge "Negatif" (dark red)
  stock_quantity = 0         → tampilkan badge "Habis" (red)
  0 < qty <= min_stock_alert → tampilkan badge "Hampir Habis" (amber)
  qty > min_stock_alert      → tampilkan badge "Aman" (green)
  stock_quantity IS NULL     → tampilkan badge "Belum Diset" (gray) — tidak block transaksi
```

### 6.4 Inventory Onboarding: Lazy Init Strategy

Karena stok belum pernah dipikirkan sebelumnya, onboarding harus tidak menyeramkan:

```
STRATEGI: Progressive Disclosure

Step 1 — Banner di halaman Ingredients (muncul sekali):
  "Aktifkan tracking stok untuk pantau bahan baku otomatis!
   Kamu bisa isi stok satu per satu, tidak harus sekaligus."
  [Mulai Setup Stok] [Nanti Saja]

Step 2 — Jika user klik "Mulai Setup Stok":
  Tampilkan modal wizard 3 langkah:
  a. Pilih ingredient mana yang mau ditrack dulu (checkbox, default semua)
  b. Untuk tiap yang dipilih: input stok saat ini + min alert
  c. Konfirmasi → simpan sebagai stock_movements type='initial'

Step 3 — Untuk ingredient yang belum diset:
  Badge "Belum Diset" (gray) di Inventory page
  Tombol "Set Stok" per ingredient
  Stok NULL tidak menghambat transaksi POS sama sekali

Step 4 — Gamification ringan:
  Progress bar "X dari Y bahan sudah ditrack"
  Semakin banyak ditrack → analytics semakin akurat
```

### 6.5 Void Transaction

```
ATURAN VOID:
  1. Hanya transaksi dengan status = 'completed' yang bisa di-void
  2. Batas waktu void: dalam hari yang sama (sale_date = CURRENT_DATE)
     → Alasan: mencegah manipulasi laporan periode sebelumnya
     → Configurable di settings untuk MVP (default: same day)
  3. Soft delete — transaksi void TETAP ADA di database dan histori
  4. Tampilkan sebagai dicoret di sales history dengan label "VOID"

STOCK REVERSAL saat void:
  FOR EACH item IN transaction_items:
    FOR EACH ingredient yang terdeduksi saat transaksi ini:
      IF ingredient.stock_quantity IS NOT NULL:
        UPDATE ingredients SET stock_quantity = stock_quantity + original_deduction
        INSERT INTO stock_movements (movement_type='void', quantity_change=+deduction)
```

### 6.6 Snapshot Pricing — Immutability Rule

```
RULE: Data di transaction_items TIDAK BOLEH BERUBAH setelah transaksi completed.

Kolom yang di-snapshot saat transaksi:
  - recipe_name (meski resep dihapus/diganti nama)
  - unit_price  (meski selling_price di resep berubah)
  - hpp_at_sale (meski HPP berubah karena harga bahan naik)

Implementasi:
  Saat create transaction_items, COPY nilai dari recipes:
    recipe_name  = recipe.name
    unit_price   = recipe.selling_price  (atau override dari user)
    hpp_at_sale  = recipe.hpp            (kalkulasi terbaru saat transaksi)

Profit aktual di analytics:
  profit = transaction_items.unit_price - transaction_items.hpp_at_sale
  BUKAN = current_recipe.selling_price - current_recipe.hpp
```

### 6.7 WhatsApp Order — Field Tambahan

```
Saat sale_channel = 'whatsapp':
  WAJIB: customer_name atau customer_contact
  OPSIONAL: notes (untuk catatan spesifik pesanan, misal "tanpa bawang")
  sale_date bisa diisi mundur (back-date) untuk order yang diterima kemarin
  payment_method bisa 'cod' atau diisi setelah barang diantar

Behavior khusus:
  Transaksi WA dengan payment_method = NULL → status = 'pending_payment'
  (Ini satu-satunya kondisi selain 'completed' dan 'voided')
  → Stok tetap terdeduksi saat status = 'pending_payment'
     (karena bahan sudah dipakai untuk menyiapkan pesanan)
  → Jika dibatalkan → void → stok di-reverse
```

### 6.8 Edge Cases

| Kasus | Behavior |
|---|---|
| Resep dihapus, tapi ada di transaction_items | `recipe_id` = NULL, snapshot data tetap valid |
| Ingredient dihapus, ada di stock_movements | `ingredient_id` = NULL, `ingredient_name` snapshot tetap ada |
| `batch_size` = 0 atau NULL di resep | Skip deduction untuk resep itu, log error, transaksi tetap sukses |
| Unit tidak compatible (gr ↔ ml) | Skip deduction ingredient itu, append ke `stock_warnings`, transaksi sukses |
| Dua transaksi simultan pada stok yang sama | Handled oleh PostgreSQL row-level locking dalam RPC function |
| Stok menjadi sangat negatif (-999 kg) | Izinkan — flag di UI, jangan block. User mungkin belum input restock |
| `sale_date` diisi masa depan | Validasi: sale_date ≤ CURRENT_DATE + 1 hari (toleransi timezone) |

---

## 7. Tiga Mode POS — User Journey Detail

### 7.1 Mode A: Walk-in / Kasir

Optimized untuk kecepatan. Target: transaksi selesai dalam < 30 detik.

```
[Bottom Nav: ikon 🧾 "Kasir"]
         │
         ▼
[Quick Sale Screen]
  Layout: Grid produk 2 kolom (mobile) / 3-4 kolom (desktop)
  Setiap card produk:
    • Nama resep
    • Harga jual (dari recipes.selling_price)
    • Stok badge (jika stock sudah diset)
  Tap produk → counter di card (+1)
  Tap lagi → +1 lagi
  Long press / tap counter → hapus dari cart
         │
         ▼
[Floating Cart Bar — sticky bottom]
  "3 item · Rp85.000"  [Bayar →]
         │
         ▼
[Checkout Sheet (bottom sheet modal)]
  • List item + qty + subtotal (editable qty di sini)
  • Input diskon (Rp atau %)
  • Total
  • Pilih pembayaran: [💵 Cash] [🏦 Transfer] [📱 QRIS]
  • Notes (opsional)
  • [Selesaikan Transaksi]
         │
         ▼
[Success State]
  • Animasi centang hijau
  • Ringkasan: Total Rp85.000 · Profit est. Rp28.000
  • Stock warnings jika ada (inline, tidak modal baru)
  • [Transaksi Baru] [Lihat Detail]
```

### 7.2 Mode B: WhatsApp Order Entry

Optimized untuk mencatat order yang sudah dinegosiasikan via WA.

```
[POS Page → Tab "Order WA" atau Tombol "+ Order WA"]
         │
         ▼
[WA Order Form]
  Section 1 — Identitas Pembeli:
    • Nama pembeli* (required)
    • No. WA (opsional, untuk referensi)

  Section 2 — Pesanan:
    • Sama seperti cart di Mode A
    • Searchable product list (bukan grid — biasanya order WA sudah spesifik)

  Section 3 — Pengiriman & Pembayaran:
    • Tanggal order (default: hari ini, bisa back-date)
    • Status pembayaran: [Sudah Lunas] [COD] [Belum Bayar]
    • Metode jika sudah lunas: [Cash] [Transfer] [QRIS]
    • Notes (misal: "antar besok jam 10, tanpa gula")

  [Simpan Order]
         │
         ▼
[Konfirmasi] → sama seperti Success State Mode A
  Tampilkan customer_name di summary
```

### 7.3 Mode C: Manual Entry / Rekap Harian

Optimized untuk pengusaha yang catat penjualan di akhir hari.

```
[Sales History Page → Tombol "+ Tambah Manual"]
         │
         ▼
[Manual Entry Form]
  • Tanggal penjualan (date picker, default: hari ini, bisa back-date max 7 hari)
  • Waktu (opsional)
  • Produk & quantity (sama seperti cart)
  • Payment method
  • Notes

  FITUR KHUSUS MANUAL: "Duplikat dari kemarin"
    → Prefill form dengan transaksi terbanyak dari hari sebelumnya
    → Berguna jika menu harian relatif sama

  [Simpan Transaksi]
```

---

## 8. Screen Specifications

### 8.1 Daftar Screens Baru + Extension

| Screen | Route | Komponen Utama | Notes |
|---|---|---|---|
| POS / Quick Sale | `/pos` | `ProductGrid`, `CartBar`, `CheckoutSheet` | New screen |
| WA Order Entry | `/pos/wa-order` | `WAOrderForm` | New screen |
| Manual Entry | `/pos/manual` | `ManualEntryForm` | New screen |
| Sales History | `/sales` | `TransactionList`, `DateRangePicker`, `SalesStats` | New screen |
| Transaction Detail | `/sales/[id]` | `LineItemTable`, `VoidButton`, `StockImpactSummary` | New screen |
| Inventory Overview | `/inventory` | `StockBadgeList`, `LowStockBanner`, `OnboardingBanner` | New screen |
| Ingredient Detail (extend) | `/ingredients/[id]` | Tambahkan `StockSection`, `MovementHistory` | Extend v1.0 |
| Dashboard (extend) | `/dashboard` | Tambahkan `DailySalesCard`, `LowStockWidget` | Extend v1.0 |

### 8.2 Navigation Extension

```
Sidebar (desktop) — extend yang sudah ada:
  ├── 🏠 Dashboard        (extend: tambah sales widget)
  ├── 🧾 Kasir / POS      ← NEW (dengan sub-menu: Walk-in | WA Order | Manual)
  ├── 📦 Ingredients      (extend: tambah stock column & badge)
  ├── 🍽️  Recipes          (tidak berubah)
  ├── 📊 Laporan          ← NEW (Sales History + Analytics)
  └── ⚙️  Settings         (tidak berubah di v2.0)

Bottom Nav (mobile) — extend yang sudah ada:
  [🏠 Home] [🧾 Kasir] [📦 Stok] [📊 Laporan]
                ↑           ↑          ↑
               NEW         NEW        NEW
```

### 8.3 Stock Badge Component

```typescript
// Reusable component, gunakan di Ingredients page, Inventory page, POS product card
type StockStatus = 'not_set' | 'negative' | 'empty' | 'low' | 'ok'

function getStockStatus(qty: number | null, minAlert: number | null): StockStatus {
  if (qty === null)            return 'not_set'   // gray  - "Belum Diset"
  if (qty < 0)                 return 'negative'  // dark red - "Negatif"
  if (qty === 0)               return 'empty'     // red - "Habis"
  if (minAlert && qty <= minAlert) return 'low'   // amber - "Hampir Habis"
  return 'ok'                                     // green - "Aman"
}
```

---

## 9. API Routes (Next.js App Router)

### 9.1 Daftar Endpoints

```typescript
// ── POS ──────────────────────────────────────────────────────
POST   /api/v2/transactions              // Create + trigger stock deduction
GET    /api/v2/transactions              // List: ?from=&to=&channel=&status=&page=&limit=
GET    /api/v2/transactions/:id          // Detail + line items + stock impact
PATCH  /api/v2/transactions/:id/void     // Void + reverse stock

// ── Inventory ────────────────────────────────────────────────
GET    /api/v2/inventory                 // All ingredients with stock status
PATCH  /api/v2/inventory/:id             // Update stock_quantity, min_stock_alert
POST   /api/v2/inventory/:id/restock     // Add restock + update stock
POST   /api/v2/inventory/bulk-init       // Onboarding: set initial stock banyak ingredient sekaligus
GET    /api/v2/inventory/:id/movements   // Stock movement history untuk satu ingredient

// ── Analytics ────────────────────────────────────────────────
GET    /api/v2/analytics/summary         // Revenue, profit, transaksi count (by date range)
GET    /api/v2/analytics/top-products    // Top selling by qty & revenue
GET    /api/v2/analytics/stock-usage     // Ingredient consumption report
```

### 9.2 Request / Response Contracts

```typescript
// POST /api/v2/transactions
// Request
interface CreateTransactionRequest {
  sale_channel: 'walkin' | 'whatsapp' | 'manual'
  payment_method?: 'cash' | 'transfer' | 'qris' | 'cod' | null
  customer_name?: string          // required jika sale_channel = 'whatsapp'
  customer_contact?: string
  discount?: number               // default 0
  notes?: string
  sale_date?: string              // ISO date, default today. Validasi: tidak boleh > tomorrow
  sale_time?: string              // HH:MM format
  items: {
    recipe_id: string
    quantity: number              // must be > 0
    unit_price: number            // harga jual saat transaksi (boleh beda dari recipe.selling_price)
  }[]
}

// Response 200
interface CreateTransactionResponse {
  transaction: Transaction
  stock_warnings: {               // ingredient yang sekarang < min_stock_alert
    ingredient_id: string
    ingredient_name: string
    stock_remaining: number
    unit: string
    min_alert: number
  }[]
  skipped_deductions: {           // ingredient yang skip karena stok NULL atau unit mismatch
    ingredient_name: string
    reason: 'stock_not_initialized' | 'unit_mismatch' | 'recipe_not_found'
  }[]
}

// PATCH /api/v2/transactions/:id/void
interface VoidTransactionRequest {
  reason: string  // required, minimal 10 karakter
}

// POST /api/v2/inventory/bulk-init (Onboarding)
interface BulkInitStockRequest {
  items: {
    ingredient_id: string
    stock_quantity: number
    stock_unit: string
    min_stock_alert?: number
  }[]
}
```

### 9.3 Error Responses

```typescript
// Semua error mengikuti format standar
interface APIError {
  error: string           // machine-readable: "TRANSACTION_NOT_FOUND"
  message: string         // human-readable untuk toast/alert
  details?: unknown       // debug info, hanya di development
}

// HTTP status codes:
// 400 — Validasi gagal (qty <= 0, sale_date di masa depan, dll)
// 403 — RLS violation (user coba akses data user lain)
// 404 — Resource tidak ditemukan
// 409 — Conflict (misal: void transaksi yang sudah void)
// 422 — Business logic error (misal: void transaksi kemarin — lewat batas waktu)
// 500 — Server error (RPC gagal, dll)
```

---

## 10. Supabase: RLS & RPC

### 10.1 Row Level Security

```sql
-- ── transactions ──────────────────────────────────────────
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_owner_only" ON transactions
  FOR ALL USING (auth.uid() = user_id);

-- ── transaction_items ─────────────────────────────────────
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transaction_items_via_owner" ON transaction_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_id AND t.user_id = auth.uid()
    )
  );

-- ── stock_movements ───────────────────────────────────────
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_movements_owner_only" ON stock_movements
  FOR ALL USING (auth.uid() = user_id);

-- ── restock_logs ──────────────────────────────────────────
ALTER TABLE restock_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restock_logs_owner_only" ON restock_logs
  FOR ALL USING (auth.uid() = user_id);
```

### 10.2 Atomic RPC: process_sale

```sql
-- Dipanggil dari /api/v2/transactions (POST)
-- Menangani: insert transaction, insert items, deduct stock, log movements
-- Semua dalam satu transaction — all or nothing
CREATE OR REPLACE FUNCTION process_sale(
  p_user_id        UUID,
  p_sale_channel   TEXT,
  p_payment_method TEXT,
  p_customer_name  TEXT,
  p_customer_contact TEXT,
  p_discount       DECIMAL,
  p_notes          TEXT,
  p_sale_date      DATE,
  p_sale_time      TIME,
  p_items          JSONB     -- array of {recipe_id, quantity, unit_price, hpp_at_sale}
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id   UUID := gen_random_uuid();
  v_trx_number       TEXT;
  v_subtotal         DECIMAL := 0;
  v_total            DECIMAL;
  v_item             JSONB;
  v_recipe           RECORD;
  v_ri               RECORD;
  v_ingredient       RECORD;
  v_deduction        DECIMAL;
  v_qty_before       DECIMAL;
  v_warnings         JSONB := '[]'::JSONB;
  v_skipped          JSONB := '[]'::JSONB;
BEGIN
  -- Generate nomor transaksi
  SELECT 'TRX-' || TO_CHAR(p_sale_date, 'YYYYMMDD') || '-' ||
         LPAD(COALESCE((
           SELECT COUNT(*)::TEXT FROM transactions
           WHERE user_id = p_user_id AND sale_date = p_sale_date
         ), '0'), 4, '0')
  INTO v_trx_number;

  -- Hitung subtotal
  SELECT SUM((item->>'unit_price')::DECIMAL * (item->>'quantity')::INT)
  INTO v_subtotal
  FROM jsonb_array_elements(p_items) AS item;

  v_total := v_subtotal - COALESCE(p_discount, 0);

  -- Insert transaction header
  INSERT INTO transactions (
    id, user_id, trx_number, sale_channel, payment_method,
    customer_name, customer_contact, subtotal, discount, total,
    notes, sale_date, sale_time
  ) VALUES (
    v_transaction_id, p_user_id, v_trx_number, p_sale_channel, p_payment_method,
    p_customer_name, p_customer_contact, v_subtotal, COALESCE(p_discount, 0), v_total,
    p_notes, p_sale_date, p_sale_time
  );

  -- Insert line items + deduct stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP

    -- Insert line item
    INSERT INTO transaction_items (
      transaction_id, recipe_id, recipe_name, quantity, unit_price, hpp_at_sale, subtotal
    ) VALUES (
      v_transaction_id,
      (v_item->>'recipe_id')::UUID,
      v_item->>'recipe_name',
      (v_item->>'quantity')::INT,
      (v_item->>'unit_price')::DECIMAL,
      (v_item->>'hpp_at_sale')::DECIMAL,
      (v_item->>'unit_price')::DECIMAL * (v_item->>'quantity')::INT
    );

    -- Deduct stock per ingredient dalam resep
    FOR v_ri IN
      SELECT ri.ingredient_id, ri.quantity, ri.unit, r.batch_size
      FROM recipe_ingredients ri
      JOIN recipes r ON r.id = ri.recipe_id
      WHERE ri.recipe_id = (v_item->>'recipe_id')::UUID
    LOOP
      SELECT * INTO v_ingredient FROM ingredients WHERE id = v_ri.ingredient_id;

      -- Skip jika stok belum diinit (NULL)
      IF v_ingredient.stock_quantity IS NULL THEN
        v_skipped := v_skipped || jsonb_build_object(
          'ingredient_name', v_ingredient.name,
          'reason', 'stock_not_initialized'
        );
        CONTINUE;
      END IF;

      -- Hitung deduction (menggunakan fungsi konversi)
      -- convert_unit harus sudah ada sebagai function di Supabase
      BEGIN
        v_deduction := convert_unit(
          v_ri.quantity / NULLIF(v_ri.batch_size, 0) * (v_item->>'quantity')::INT,
          v_ri.unit,
          v_ingredient.stock_unit
        );
      EXCEPTION WHEN OTHERS THEN
        v_skipped := v_skipped || jsonb_build_object(
          'ingredient_name', v_ingredient.name,
          'reason', 'unit_mismatch'
        );
        CONTINUE;
      END;

      v_qty_before := v_ingredient.stock_quantity;

      -- Update stok (boleh jadi negatif)
      UPDATE ingredients
      SET stock_quantity = stock_quantity - v_deduction
      WHERE id = v_ingredient.id;

      -- Log movement
      INSERT INTO stock_movements (
        user_id, ingredient_id, ingredient_name, movement_type,
        quantity_change, quantity_before, quantity_after,
        unit, reference_id, reference_type
      ) VALUES (
        p_user_id, v_ingredient.id, v_ingredient.name, 'sale',
        -v_deduction, v_qty_before, v_qty_before - v_deduction,
        v_ingredient.stock_unit, v_transaction_id, 'transaction'
      );

      -- Cek low stock warning
      IF v_ingredient.min_stock_alert IS NOT NULL AND
         (v_qty_before - v_deduction) < v_ingredient.min_stock_alert THEN
        v_warnings := v_warnings || jsonb_build_object(
          'ingredient_id', v_ingredient.id,
          'ingredient_name', v_ingredient.name,
          'stock_remaining', v_qty_before - v_deduction,
          'unit', v_ingredient.stock_unit,
          'min_alert', v_ingredient.min_stock_alert
        );
      END IF;

    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'trx_number', v_trx_number,
    'total', v_total,
    'stock_warnings', v_warnings,
    'skipped_deductions', v_skipped
  );

EXCEPTION WHEN OTHERS THEN
  -- Rollback otomatis karena dalam satu transaction
  RAISE EXCEPTION 'process_sale failed: %', SQLERRM;
END;
$$;
```

### 10.3 RPC: void_transaction

```sql
CREATE OR REPLACE FUNCTION void_transaction(
  p_user_id        UUID,
  p_transaction_id UUID,
  p_reason         TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trx      RECORD;
  v_movement RECORD;
BEGIN
  -- Ambil transaksi
  SELECT * INTO v_trx FROM transactions
  WHERE id = p_transaction_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TRANSACTION_NOT_FOUND';
  END IF;

  IF v_trx.status = 'voided' THEN
    RAISE EXCEPTION 'ALREADY_VOIDED';
  END IF;

  -- Cek batas waktu void (same day only)
  IF v_trx.sale_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'VOID_WINDOW_EXPIRED: transaksi hanya bisa di-void di hari yang sama';
  END IF;

  -- Update status transaksi
  UPDATE transactions
  SET status = 'voided', voided_at = NOW(), voided_reason = p_reason
  WHERE id = p_transaction_id;

  -- Reverse semua stock movements terkait
  FOR v_movement IN
    SELECT * FROM stock_movements
    WHERE reference_id = p_transaction_id AND movement_type = 'sale'
  LOOP
    UPDATE ingredients
    SET stock_quantity = stock_quantity + ABS(v_movement.quantity_change)
    WHERE id = v_movement.ingredient_id;

    INSERT INTO stock_movements (
      user_id, ingredient_id, ingredient_name, movement_type,
      quantity_change, quantity_before, quantity_after,
      unit, reference_id, reference_type, notes
    ) VALUES (
      p_user_id, v_movement.ingredient_id, v_movement.ingredient_name, 'void',
      ABS(v_movement.quantity_change),
      v_movement.quantity_after,
      v_movement.quantity_after + ABS(v_movement.quantity_change),
      v_movement.unit, p_transaction_id, 'transaction',
      'Stock reversal for void: ' || p_reason
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'voided_at', NOW());

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION '%', SQLERRM;
END;
$$;
```

---

## 11. TypeScript Types (Shared)

```typescript
// /types/pos.ts — tambahkan ke project

export type SaleChannel = 'walkin' | 'whatsapp' | 'manual'
export type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'cod'
export type TransactionStatus = 'completed' | 'voided' | 'pending_payment'
export type MovementType = 'sale' | 'restock' | 'adjustment' | 'void' | 'initial'
export type StockStatus = 'not_set' | 'negative' | 'empty' | 'low' | 'ok'

export interface Transaction {
  id: string
  user_id: string
  trx_number: string
  sale_channel: SaleChannel
  status: TransactionStatus
  payment_method: PaymentMethod | null
  customer_name: string | null
  customer_contact: string | null
  subtotal: number
  discount: number
  total: number
  notes: string | null
  sale_date: string             // ISO date
  sale_time: string | null
  created_at: string
  voided_at: string | null
  voided_reason: string | null
  items?: TransactionItem[]     // joined on demand
}

export interface TransactionItem {
  id: string
  transaction_id: string
  recipe_id: string | null
  recipe_name: string           // snapshot
  quantity: number
  unit_price: number            // snapshot
  hpp_at_sale: number | null    // snapshot
  subtotal: number
}

export interface IngredientWithStock {
  id: string
  name: string
  price: number
  quantity: number              // beli per satuan (existing)
  unit: string                  // satuan beli (existing)
  stock_quantity: number | null // v2.0
  stock_unit: string | null     // v2.0
  min_stock_alert: number | null // v2.0
  last_restocked_at: string | null // v2.0
  stock_status: StockStatus     // computed client-side
}

export interface StockMovement {
  id: string
  ingredient_id: string | null
  ingredient_name: string
  movement_type: MovementType
  quantity_change: number
  quantity_before: number | null
  quantity_after: number | null
  unit: string | null
  reference_id: string | null
  reference_type: string | null
  notes: string | null
  created_at: string
}

export interface CartItem {
  recipe_id: string
  recipe_name: string
  unit_price: number
  hpp: number | null
  quantity: number
}

// Zustand store interface
export interface POSStore {
  cart: CartItem[]
  saleChannel: SaleChannel
  paymentMethod: PaymentMethod | null
  discount: number
  customerName: string
  customerContact: string
  notes: string
  // Actions
  addToCart: (recipe: RecipeWithHPP) => void
  removeFromCart: (recipeId: string) => void
  updateQuantity: (recipeId: string, qty: number) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setDiscount: (amount: number) => void
  setSaleChannel: (channel: SaleChannel) => void
  clearCart: () => void
  getTotal: () => number
  getSubtotal: () => number
}
```

---

## 12. Component Architecture

```
/components
  /pos
    QuickSaleGrid.tsx        -- grid produk untuk kasir
    CartBar.tsx              -- sticky bottom bar dengan total & tombol bayar
    CheckoutSheet.tsx        -- bottom sheet: review, payment, confirm
    WAOrderForm.tsx          -- form untuk order WhatsApp
    ManualEntryForm.tsx      -- form untuk entry manual
    TransactionSuccess.tsx   -- success state dengan animasi
    StockWarningToast.tsx    -- toast untuk low-stock warning post-transaksi

  /inventory
    StockBadge.tsx           -- reusable badge (not_set|negative|empty|low|ok)
    StockOnboardingBanner.tsx -- banner lazy init
    StockInitWizard.tsx      -- wizard 3-step untuk bulk init
    RestockModal.tsx         -- modal tambah stok
    StockMovementChart.tsx   -- mini chart 7 hari
    ManualAdjustModal.tsx    -- modal koreksi manual

  /sales
    TransactionList.tsx      -- list dengan filter
    TransactionCard.tsx      -- card satu transaksi (untuk mobile)
    TransactionRow.tsx       -- row tabel (untuk desktop)
    TransactionDetail.tsx    -- detail + void button
    SalesStatsBar.tsx        -- summary stats di atas list

  /analytics
    DailySummaryCard.tsx     -- card di dashboard
    RevenueChart.tsx         -- recharts line chart (reuse library v1.0 jika ada)
    TopProductsTable.tsx     -- tabel top produk
    LowStockWidget.tsx       -- widget dashboard untuk bahan hampir habis
```

---

## 13. Vibe Coding Prompts

Copy-paste prompt ini ke AI coding assistant (Cursor, GitHub Copilot, dll) untuk generate komponen yang konsisten dengan codebase v1.0:

### System Prompt (pakai di awal setiap sesi)

```
Kamu sedang mengembangkan HargaKu v2.0 — sebuah Next.js 14 app dengan
TypeScript, Tailwind CSS, dan Supabase.

CODEBASE YANG SUDAH ADA (v1.0):
- Design system: Emerald/Green theme, glassmorphism effects, Inter font
- Komponen yang sudah ada: Sidebar, BottomNav, IngredientForm, RecipeForm,
  HPPCalculator, RecipeList, RecipeDetail
- Utils yang sudah ada: unitConversion.ts (mendukung kg↔gr, L↔ml, lusin↔pcs)
- State management: [sesuaikan dengan yang dipakai di v1.0 — Zustand/Context]
- Supabase client: sudah ada di /lib/supabase.ts

SCHEMA DATABASE:
-- EXISTING:
ingredients (id, name, price, quantity, unit, user_id, created_at, updated_at)
recipes (id, name, category, batch_size, selling_price, hpp, user_id, created_at)
recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit)

-- NEW v2.0 (sudah dimigrasikan):
ingredients: +stock_quantity, +stock_unit, +min_stock_alert, +last_restocked_at
transactions (id, user_id, trx_number, sale_channel, status, payment_method,
              customer_name, subtotal, discount, total, sale_date, ...)
transaction_items (id, transaction_id, recipe_id, recipe_name SNAPSHOT,
                   quantity, unit_price SNAPSHOT, hpp_at_sale SNAPSHOT, subtotal)
stock_movements (id, user_id, ingredient_id, ingredient_name SNAPSHOT,
                 movement_type, quantity_change, quantity_before, quantity_after, ...)
restock_logs (id, user_id, ingredient_id, quantity_added, unit, purchase_price, ...)

RULES:
1. Semua komponen baru harus visual-konsisten dengan v1.0 (Emerald theme)
2. Selalu gunakan TypeScript dengan type definitions dari /types/pos.ts
3. Untuk operasi stok: selalu gunakan Supabase RPC process_sale, JANGAN
   update stock_quantity langsung dari client
4. Snapshot rule: unit_price dan hpp_at_sale di transaction_items adalah
   nilai saat transaksi — tidak boleh berubah
5. Stok NULL ≠ stok 0. NULL berarti belum diinit, 0 berarti habis
6. Jangan block transaksi karena stok. Tampilkan warning saja.
```

### Feature-Specific Prompts

```
-- Untuk QuickSaleGrid:
"Buat komponen QuickSaleGrid.tsx untuk POS kasir. Grid 2 kolom mobile /
3 kolom desktop. Setiap card tampilkan nama resep, harga jual (formatted Rupiah),
dan StockBadge. Tap card = addToCart. Long press card = view recipe detail.
Ada search bar di atas untuk filter produk. Gunakan data dari Supabase
real-time subscription agar update otomatis jika harga resep berubah."

-- Untuk StockBadge:
"Buat komponen StockBadge.tsx yang menerima props: stockQty (number|null),
minAlert (number|null), unit (string). Return badge dengan warna dan label
sesuai getStockStatus() dari /types/pos.ts. Status 'low' harus ada pulse
animation. Gunakan Tailwind classes konsisten dengan emerald theme."

-- Untuk process_sale integration:
"Buat hook useCreateTransaction() yang wraps Supabase RPC process_sale.
Implement optimistic update: update local cart state dulu sebelum RPC selesai,
rollback jika RPC error. Return { createTransaction, isLoading, stockWarnings,
skippedDeductions, error }. Tampilkan stockWarnings sebagai toast setelah sukses."
```

---

## 14. Migration Plan

> Zero downtime — existing users tidak terganggu selama migration.

### Phase 8: Schema & Foundation (Hari 1–3)

```
Hari 1:
  □ ALTER TABLE ingredients (tambah kolom nullable — no downtime)
  □ CREATE TABLE transactions, transaction_items, stock_movements, restock_logs
  □ CREATE INDEX semua tabel baru
  □ Enable RLS + CREATE POLICY semua tabel baru

Hari 2:
  □ CREATE FUNCTION convert_unit() di Supabase (port dari unitConversion.ts)
  □ CREATE FUNCTION process_sale()
  □ CREATE FUNCTION void_transaction()
  □ Test RPC di Supabase SQL editor dengan data dummy

Hari 3:
  □ Deploy schema changes ke production
  □ Verifikasi existing app masih berjalan normal (smoke test)
  □ Add /types/pos.ts ke codebase
  □ Setup Zustand POSStore
```

### Phase 9: Inventory Module (Hari 4–6)

```
Hari 4:
  □ StockBadge component
  □ Extend Ingredients page: tambah kolom stock di tabel
  □ StockOnboardingBanner (lazy init)

Hari 5:
  □ StockInitWizard (3-step onboarding)
  □ RestockModal
  □ /api/v2/inventory endpoints

Hari 6:
  □ Inventory Overview page (/inventory)
  □ StockMovementChart
  □ Extend Dashboard: LowStockWidget
  □ Test end-to-end inventory flow
```

### Phase 10: POS Module (Hari 7–11)

```
Hari 7-8:
  □ QuickSaleGrid + CartBar + CheckoutSheet (Walk-in mode)
  □ useCreateTransaction hook dengan optimistic update
  □ TransactionSuccess screen dengan StockWarningToast

Hari 9:
  □ WAOrderForm (WhatsApp Order mode)
  □ ManualEntryForm dengan back-date support

Hari 10:
  □ Sales History page + TransactionDetail
  □ VoidButton + void_transaction integration

Hari 11:
  □ Update Bottom Nav + Sidebar navigation
  □ QA semua 3 mode POS
  □ Test stock deduction end-to-end
```

### Phase 11: Analytics & Polish (Hari 12–14)

```
Hari 12:
  □ DailySummaryCard di Dashboard
  □ /api/v2/analytics/summary endpoint
  □ RevenueChart (recharts)

Hari 13:
  □ TopProductsTable
  □ Profit actuals calculation
  □ Export PDF laporan penjualan

Hari 14:
  □ Full QA + bug fix
  □ Performance check (query heavy di analytics)
  □ Final smoke test di mobile
```

---

## 15. Scope & Batasan

### 15.1 In Scope (v2.0)

- Web app mobile-responsive (extend v1.0)
- Tiga mode POS: Walk-in, WhatsApp Order, Manual Entry
- Inventory onboarding (lazy init) + restock log
- Auto stock deduction via atomic Supabase RPC
- Sales history + basic analytics (revenue, profit, top products)
- Void transaksi dengan stock reversal (same-day only)
- Export laporan penjualan PDF

### 15.2 Out of Scope → v2.1 & Beyond

- Offline mode dengan queue & sync saat online
- Barcode / QR scanner produk
- Printer struk thermal (ESC/POS protocol)
- Split payment (sebagian cash, sebagian transfer)
- Multi-outlet / multi-kasir dalam satu akun
- Integrasi payment gateway (Midtrans, Xendit)
- Notifikasi push browser untuk low-stock
- Laporan pajak & PPn otomatis
- Supplier management & purchase order

---

## 16. Open Questions — Status

Pertanyaan dari PRD awal, dijawab berdasarkan decisions di dokumen ini:

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Onboarding stok awal? | ✅ **Lazy init** — wizard opsional, bisa skip, tidak block POS |
| 2 | Unit mismatch gr ↔ ml? | ✅ **Skip + warning** — jangan block transaksi |
| 3 | Harga jual di POS dari mana? | ✅ **Default dari `recipes.selling_price`**, user boleh override per transaksi |
| 4 | Offline handling? | 🔜 **Out of scope v2.0** — masuk v2.1 |
| 5 | Low-stock notification? | ✅ **Badge in-app + toast post-transaksi** — push notification di v2.1 |
| 6 | Void time limit? | ✅ **Same day only** (sale_date = CURRENT_DATE) — configurable di settings |
| 7 | Resep multi-ukuran? | 🔜 **Out of scope v2.0** — workaround: buat 2 resep terpisah (250gr & 500gr) |

---

## 17. Dependency Map & Build Order

```
F01 (Stock Level + Onboarding)
  └──► F02 (Auto-deduct)
         └──► F03 (Walk-in Quick Sale)
               └──► F04 (Cart multi-item)
                     └──► F05 (Payment method)
                     └──► F06 (WA Order Entry)
                     └──► F07 (Manual Entry)
                     └──► F08 (Sales History)
                           └──► F13 (Void + Stock Reversal)
                           └──► F11 (Dashboard Summary)
                           └──► F12 (Profit Actuals)
                                 └──► F15 (Export PDF)
                                 └──► F16 (Usage Report)
  └──► F09 (Low-stock alert)     — parallel setelah F01
  └──► F10 (Restock log)         — parallel setelah F01
F14 (Manual adjustment)          — independent, kapan saja setelah F01
```

**Recommended build order:**
`F01 → F02 → F03 → F04 → F05 → F06 → F07 → F08 → F09 → F10 → F11 → F12 → F13`

---

*HargaKu POS Integration PRD v2.0 — Maret 2026 — Confidential*
*Untuk tim dev Antigravity. Review dan iterasi welcome.*